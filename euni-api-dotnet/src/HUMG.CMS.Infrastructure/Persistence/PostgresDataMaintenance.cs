using System.Reflection;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Seed;
using Npgsql;
using NpgsqlTypes;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>
/// Tác vụ bảo trì bằng role <c>cms_admin</c> (BYPASSRLS), tách khỏi role ứng dụng <c>cms_app</c>:
/// áp lược đồ, nạp dữ liệu mẫu khi database trống, xuất/nhập (sao lưu, phục hồi), dựng lại dữ liệu mẫu.
/// </summary>
public sealed class PostgresDataMaintenance : IDataMaintenance
{
    private const long AdvisoryLock = 7_461_001;
    private static readonly HashSet<string> RootReserved = new() { "seq", "collections", "settings", "snapshots" };

    private readonly NpgsqlDataSource _admin;
    private readonly IMockData _mock;
    private readonly bool _migrate;

    public PostgresDataMaintenance(NpgsqlDataSource adminSource, IMockData mock, bool migrate) { _admin = adminSource; _mock = mock; _migrate = migrate; }

    private static string SchemaSql()
    {
        var asm = Assembly.GetExecutingAssembly();
        using var s = asm.GetManifestResourceStream("schema.sql") ?? throw new InvalidOperationException("Thiếu schema.sql nhúng trong assembly.");
        using var r = new StreamReader(s);
        return r.ReadToEnd();
    }

    public void EnsureReady()
    {
        using var conn = _admin.OpenConnection();
        Run(conn, null, "SELECT pg_advisory_lock(@k)", ("k", AdvisoryLock));
        try
        {
            if (_migrate) Run(conn, null, SchemaSql());
            var seeded = Convert.ToInt64(Scalar(conn, null, "SELECT count(*) FROM cms_api.global_documents WHERE collection = '_meta' AND key = 'schemaVersion'")) > 0;
            if (!seeded) { using var tx = conn.BeginTransaction(); ImportCore(conn, tx, new MockSeedBuilder(_mock).Build(), Array.Empty<string>()); tx.Commit(); }
        }
        finally { Run(conn, null, "SELECT pg_advisory_unlock(@k)", ("k", AdvisoryLock)); }
    }

    public void Reset()
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction();
        Run(conn, tx, "TRUNCATE cms_api.tenant_documents, cms_api.global_documents, cms_api.sequences RESTART IDENTITY");
        ImportCore(conn, tx, new MockSeedBuilder(_mock).Build(), Array.Empty<string>());
        tx.Commit();
    }

    public void Import(JsonObject data, IReadOnlyCollection<string> keep)
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction();
        ImportCore(conn, tx, data, keep);
        tx.Commit();
    }

    public JsonObject Export()
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction(System.Data.IsolationLevel.RepeatableRead);
        var root = new JsonObject();
        var seq = new JsonObject(); var cols = new JsonObject(); var settings = new JsonObject();
        using (var cmd = new NpgsqlCommand("SELECT collection, last_id FROM cms_api.sequences ORDER BY collection", conn, tx))
        using (var rd = cmd.ExecuteReader()) while (rd.Read()) seq[rd.GetString(0)] = rd.GetInt64(1);
        root["seq"] = seq; root["collections"] = cols; root["settings"] = settings;
        void Read(string table, bool tenantTable)
        {
            using var cmd = new NpgsqlCommand($"SELECT collection, key, doc::text FROM {table} ORDER BY collection, ord", conn, tx);
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                var c = rd.GetString(0); var node = JsonNode.Parse(rd.GetString(2));
                if (c == DocumentCatalog.Meta) { var k = rd.GetString(1); if (k != "snapshots") root[k] = node; }
                else if (c == DocumentCatalog.Settings) settings[rd.GetString(1)] = node;
                else (cols[c] ??= new JsonArray()).AsArray().Add(node);
            }
        }
        Read("cms_api.global_documents", false); Read("cms_api.tenant_documents", true);
        return root;
    }

    // ------------------------------------------------------------ nhập

    private static void ImportCore(NpgsqlConnection conn, NpgsqlTransaction tx, JsonObject data, IReadOnlyCollection<string> keep)
    {
        var keepArr = keep.ToArray();
        Run(conn, tx, "DELETE FROM cms_api.tenant_documents WHERE collection <> ALL(@k)", ("k", keepArr));
        Run(conn, tx, "DELETE FROM cms_api.global_documents WHERE collection <> ALL(@k) AND NOT (collection = '_meta' AND key = 'snapshots')", ("k", keepArr));
        Run(conn, tx, "DELETE FROM cms_api.sequences WHERE collection <> ALL(@k)", ("k", keepArr));

        void Put(string collection, string key, string? tenant, JsonNode doc)
        {
            var global = tenant is null;
            using var cmd = new NpgsqlCommand(global
                ? "INSERT INTO cms_api.global_documents (collection, key, doc) VALUES (@c, @k, @d) ON CONFLICT (collection, key) DO UPDATE SET doc = EXCLUDED.doc"
                : "INSERT INTO cms_api.tenant_documents (collection, key, tenant_id, doc) VALUES (@c, @k, @t, @d)", conn, tx);
            cmd.Parameters.AddWithValue("c", collection); cmd.Parameters.AddWithValue("k", key);
            if (!global) cmd.Parameters.AddWithValue("t", tenant!);
            cmd.Parameters.Add(new NpgsqlParameter("d", NpgsqlDbType.Jsonb) { Value = Doc.Stringify(doc) });
            cmd.ExecuteNonQuery();
        }

        if (data["collections"] is JsonObject cols)
            foreach (var (name, arr) in cols)
            {
                if (keep.Contains(name)) continue;
                foreach (var row in arr.Objects())
                    Put(name, DocumentCatalog.KeyOf(name, row), DocumentCatalog.IsGlobal(name) ? null : DocumentCatalog.TenantOf(name, row), row);
            }
        if (data["settings"] is JsonObject st) foreach (var (tenant, doc) in st) Put(DocumentCatalog.Settings, tenant, tenant, doc!);
        foreach (var (k, v) in data) if (!RootReserved.Contains(k) && v is not null) Put(DocumentCatalog.Meta, k, null, v);
        if (data["seq"] is JsonObject seq)
            foreach (var (name, v) in seq)
            {
                if (keep.Contains(name)) continue;
                Run(conn, tx, "INSERT INTO cms_api.sequences (collection, last_id) VALUES (@c, @v) ON CONFLICT (collection) DO UPDATE SET last_id = EXCLUDED.last_id", ("c", name), ("v", Doc.AsLong(v) ?? 0));
            }
    }

    private static void Run(NpgsqlConnection conn, NpgsqlTransaction? tx, string sql, params (string, object)[] ps)
    {
        using var cmd = new NpgsqlCommand(sql, conn, tx);
        foreach (var (n, v) in ps) cmd.Parameters.AddWithValue(n, v);
        cmd.ExecuteNonQuery();
    }

    private static object? Scalar(NpgsqlConnection conn, NpgsqlTransaction? tx, string sql)
    {
        using var cmd = new NpgsqlCommand(sql, conn, tx);
        return cmd.ExecuteScalar();
    }
}
