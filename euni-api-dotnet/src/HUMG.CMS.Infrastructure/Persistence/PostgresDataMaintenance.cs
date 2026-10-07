using System.Reflection;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence.Relational;
using HUMG.CMS.Infrastructure.Seed;
using Npgsql;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>
/// Tác vụ bảo trì bằng role <c>cms_admin</c> (BYPASSRLS), tách khỏi role ứng dụng <c>cms_app</c>:
/// áp lược đồ v2 + bổ sung, nạp dữ liệu mẫu khi database trống, xuất/nhập (sao lưu, phục hồi), dựng lại dữ liệu mẫu.
/// </summary>
public sealed class PostgresDataMaintenance : IDataMaintenance
{
    private const long AdvisoryLock = 7_461_001;
    private static readonly HashSet<string> RootReserved = new() { "seq", "collections", "settings", "snapshots" };

    private readonly NpgsqlDataSource _admin;
    private readonly IMockData _mock;
    private readonly bool _migrate;

    public PostgresDataMaintenance(NpgsqlDataSource adminSource, IMockData mock, bool migrate) { _admin = adminSource; _mock = mock; _migrate = migrate; }

    private static string Resource(string name)
    {
        using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(name) ?? throw new InvalidOperationException($"Thiếu {name} nhúng trong assembly.");
        using var r = new StreamReader(s);
        return r.ReadToEnd();
    }

    public void EnsureReady()
    {
        using var conn = _admin.OpenConnection();
        using (var l = new NpgsqlCommand("SELECT pg_advisory_lock(@k)", conn)) { l.Parameters.AddWithValue("k", AdvisoryLock); l.ExecuteNonQuery(); }
        try
        {
            if (_migrate) foreach (var sql in new[] { Resource("schema.sql"), Resource("amendments.sql") }) { using var c = new NpgsqlCommand(sql, conn); c.ExecuteNonQuery(); }
            using var tx = conn.BeginTransaction();
            var db = new Db(conn, tx);
            if (Convert.ToInt64(db.Scalar("SELECT count(*) FROM cms.app_meta WHERE key = 'schemaVersion'")) == 0) ImportCore(db, new MockSeedBuilder(_mock).Build(), Array.Empty<string>());
            tx.Commit();
        }
        finally { using var u = new NpgsqlCommand("SELECT pg_advisory_unlock(@k)", conn); u.Parameters.AddWithValue("k", AdvisoryLock); u.ExecuteNonQuery(); }
    }

    public void Reset()
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction();
        var db = new Db(conn, tx);
        var tables = db.Query("SELECT quote_ident(tablename) FROM pg_tables WHERE schemaname = 'cms' AND NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = (quote_ident(schemaname) || '.' || quote_ident(tablename))::regclass)")
            .Select(r => "cms." + (string)r[0]!);
        db.Exec($"TRUNCATE {string.Join(", ", tables)} RESTART IDENTITY CASCADE");
        ImportCore(db, new MockSeedBuilder(_mock).Build(), Array.Empty<string>());
        tx.Commit();
    }

    public void Import(JsonObject data, IReadOnlyCollection<string> keep)
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction();
        ImportCore(new Db(conn, tx), data, keep);
        tx.Commit();
    }

    public JsonObject Export()
    {
        using var conn = _admin.OpenConnection();
        using var tx = conn.BeginTransaction(System.Data.IsolationLevel.RepeatableRead);
        var db = new Db(conn, tx);
        var root = new JsonObject(); var cols = new JsonObject(); var settings = new JsonObject();
        root["collections"] = cols; root["settings"] = settings;
        foreach (var (name, map) in MapRegistry.All)
        {
            var loaded = map.Load(db);
            if (map is SettingsMap) foreach (var l in loaded) settings[l.Key] = l.Doc;
            else if (map is MetaMap) { foreach (var l in loaded) if (l.Key != "snapshots") root[l.Key] = l.Doc; }
            else cols[name] = new JsonArray(loaded.Select(l => (JsonNode?)l.Doc).ToArray());
        }
        return root;
    }

    // ------------------------------------------------------------ nhập

    /// <summary>Thay dữ liệu bằng <paramref name="data"/> trong MỘT transaction (FK hoãn tới commit nên không phụ thuộc thứ tự), giữ nguyên các collection trong <paramref name="keep"/>.</summary>
    private static void ImportCore(Db db, JsonObject data, IReadOnlyCollection<string> keep)
    {
        foreach (var (name, map) in MapRegistry.All) if (!keep.Contains(name)) map.DeleteAll(db);
        var cols = data["collections"] as JsonObject ?? new JsonObject();
        foreach (var (name, map) in MapRegistry.All)
        {
            if (keep.Contains(name) || map is SettingsMap or MetaMap || !cols.ContainsKey(name)) continue;
            foreach (var d in cols[name].Objects())
            {
                var doc = d.Copy();
                if (map.RemapIdsOnImport) doc["id"] = map.NextId(db);    // bảng dùng chung nhiều collection: cấp id mới để không trùng
                map.Save(db, doc);
            }
        }
        var sm = (SettingsMap)MapRegistry.For(DocumentCatalog.Settings);
        if (data["settings"] is JsonObject st) foreach (var (tenant, doc) in st) if (doc is JsonObject o) sm.Save(db, tenant, o);
        var mm = (MetaMap)MapRegistry.For(DocumentCatalog.Meta);
        foreach (var (k, v) in data) if (!RootReserved.Contains(k) && v is not null) mm.Save(db, k, v);
        // đặt lại bộ đếm identity theo id lớn nhất
        foreach (var t in MapRegistry.All.Values.SelectMany(m => m.IdentityTables).Distinct())
            db.Exec($"SELECT setval(pg_get_serial_sequence('{t}', 'id'), COALESCE((SELECT max(id) FROM {t}), 1), (SELECT max(id) IS NOT NULL FROM {t}))");
    }
}
