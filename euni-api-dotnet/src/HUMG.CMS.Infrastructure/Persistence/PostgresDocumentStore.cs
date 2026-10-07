using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using Npgsql;
using NpgsqlTypes;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>
/// Unit-of-work của một request trên PostgreSQL: đọc trực tiếp từ bảng, theo dõi thay đổi trên các bản ghi đã nạp,
/// rồi ghi tất cả (nội dung + revision + workflow history + audit…) trong MỘT transaction ở <see cref="Flush"/>.
/// Transaction mang ngữ cảnh tenant cho Row-Level Security: <c>app.tenant_ids</c> (được đọc) và <c>app.tenant_id</c> (đang ghi, đặt theo từng nhóm bản ghi).
/// </summary>
public sealed class PostgresDocumentStore : IDocumentStore, IDisposable
{
    private sealed class Entry
    {
        public required string Key;
        public required JsonNode Doc;
        public string? Original;      // null = bản ghi mới
        public bool Deleted;
        public string? Tenant;        // null với bảng dùng chung
    }

    private readonly NpgsqlDataSource _source;
    private readonly RequestContext _ctx;
    private NpgsqlConnection? _conn;
    private NpgsqlTransaction? _tx;
    private readonly Dictionary<string, List<Entry>> _cache = new();

    public PostgresDocumentStore(NpgsqlDataSource appSource, RequestContext ctx) { _source = appSource; _ctx = ctx; }

    // ------------------------------------------------------------ kết nối + ngữ cảnh tenant

    private string? _applied;

    private string ReadTenantsNow() => string.Join(',', _ctx.ReadTenants is { Count: > 0 } r ? r : new[] { _ctx.Tenant });

    /// <summary>Mở transaction khi cần và bảo đảm ngữ cảnh tenant (đọc/ghi) khớp RequestContext hiện tại — tenant được xác định sau khi store đã mở.</summary>
    private NpgsqlTransaction Tx()
    {
        if (_tx is null) { _conn = _source.OpenConnection(); _tx = _conn.BeginTransaction(); _applied = null; }
        var key = $"{ReadTenantsNow()}|{_ctx.Tenant}";
        if (_applied != key) { SetTenantContext(ReadTenantsNow(), _ctx.Tenant); _applied = key; }
        return _tx;
    }

    private void SetTenantContext(string readTenants, string writeTenant)
    {
        using var cmd = new NpgsqlCommand("SELECT set_config('app.tenant_ids', @r, true), set_config('app.tenant_id', @w, true)", _conn, _tx);
        cmd.Parameters.AddWithValue("r", readTenants);
        cmd.Parameters.AddWithValue("w", writeTenant);
        cmd.ExecuteNonQuery();
    }

    private void Release()
    {
        _tx?.Dispose(); _tx = null;
        _conn?.Dispose(); _conn = null;
        _cache.Clear();
    }

    // ------------------------------------------------------------ nạp

    private List<Entry> Load(string collection)
    {
        if (_cache.TryGetValue(collection, out var list)) return list;
        list = new List<Entry>();
        var global = DocumentCatalog.IsGlobal(collection);
        var sql = global
            ? "SELECT key, doc::text, NULL FROM cms_api.global_documents WHERE collection = @c ORDER BY ord"
            : "SELECT key, doc::text, tenant_id FROM cms_api.tenant_documents WHERE collection = @c ORDER BY ord";
        using (var cmd = new NpgsqlCommand(sql, _conn ?? OpenOnly(), Tx()))
        {
            cmd.Parameters.AddWithValue("c", collection);
            using var rd = cmd.ExecuteReader();
            while (rd.Read())
            {
                var node = JsonNode.Parse(rd.GetString(1))!;
                list.Add(new Entry { Key = rd.GetString(0), Doc = node, Original = Doc.Stringify(node), Tenant = rd.IsDBNull(2) ? null : rd.GetString(2) });
            }
        }
        _cache[collection] = list;
        return list;
    }
    private NpgsqlConnection OpenOnly() { Tx(); return _conn!; }

    public List<JsonObject> Rows(string collection) => Load(collection).Where(e => !e.Deleted && e.Doc is JsonObject).Select(e => (JsonObject)e.Doc).ToList();

    // ------------------------------------------------------------ ghi (gom trong bộ nhớ, ghi ở Flush)

    public JsonObject Insert(string collection, JsonObject data)
    {
        var list = Load(collection);
        long id;
        using (var cmd = new NpgsqlCommand("SELECT cms_api.next_id(@c)", _conn, Tx()))
        {
            cmd.Parameters.AddWithValue("c", collection);
            id = (long)cmd.ExecuteScalar()!;
        }
        var row = new JsonObject { ["id"] = id };
        foreach (var kv in data) row[kv.Key] = kv.Value?.DeepClone();
        row["id"] = id;
        list.Add(NewEntry(collection, row));
        return row;
    }

    public void Push(string collection, JsonObject row) => Load(collection).Add(NewEntry(collection, row));

    private static Entry NewEntry(string collection, JsonObject row) => new()
    {
        Key = DocumentCatalog.KeyOf(collection, row), Doc = row, Original = null,
        Tenant = DocumentCatalog.IsGlobal(collection) ? null : DocumentCatalog.TenantOf(collection, row),
    };

    public JsonObject? Update(string collection, long id, JsonObject patch)
    {
        var e = Load(collection).FirstOrDefault(x => !x.Deleted && x.Doc is JsonObject o && o.Long("id") == id);
        if (e is null) return null;
        var row = (JsonObject)e.Doc;
        foreach (var kv in patch) if (kv.Key != "id") row[kv.Key] = kv.Value?.DeepClone();
        return row;
    }

    public bool Remove(string collection, long id)
    {
        var list = Load(collection);
        var e = list.FirstOrDefault(x => !x.Deleted && x.Doc is JsonObject o && o.Long("id") == id);
        if (e is null) return false;
        if (e.Original is null) list.Remove(e); else e.Deleted = true;
        return true;
    }

    // ------------------------------------------------------------ cấu hình tenant · metadata

    public JsonObject? GetSettings(string tenant) => Load(DocumentCatalog.Settings).FirstOrDefault(e => !e.Deleted && e.Key == tenant)?.Doc as JsonObject;

    public void SetSettings(string tenant, JsonObject settings)
    {
        var list = Load(DocumentCatalog.Settings);
        var e = list.FirstOrDefault(x => x.Key == tenant);
        if (e is not null) { e.Doc = settings; e.Deleted = false; }
        else list.Add(new Entry { Key = tenant, Doc = settings, Original = null, Tenant = tenant });
    }

    public JsonNode? GetMeta(string key) => Load(DocumentCatalog.Meta).FirstOrDefault(e => !e.Deleted && e.Key == key)?.Doc;

    public void SetMeta(string key, JsonNode? value)
    {
        var list = Load(DocumentCatalog.Meta);
        var e = list.FirstOrDefault(x => x.Key == key);
        if (value is null) { if (e is not null) { if (e.Original is null) list.Remove(e); else e.Deleted = true; } return; }
        if (e is not null) { e.Doc = value; e.Deleted = false; }
        else list.Add(new Entry { Key = key, Doc = value, Original = null });
    }

    public void MarkDirty() { /* thay đổi được phát hiện bằng so sánh nội dung khi Flush */ }

    // ------------------------------------------------------------ commit / rollback

    public void Flush()
    {
        if (_tx is null) return;
        try
        {
            var ops = new List<(string Collection, Entry E, char Op)>();
            foreach (var (collection, list) in _cache)
                foreach (var e in list)
                {
                    if (e.Original is null) { if (!e.Deleted) ops.Add((collection, e, 'I')); }
                    else if (e.Deleted) ops.Add((collection, e, 'D'));
                    else if (Doc.Stringify(e.Doc) != e.Original) ops.Add((collection, e, 'U'));
                }
            // dữ liệu dùng chung trước, sau đó từng tenant (đặt app.tenant_id đúng tenant của bản ghi để qua WITH CHECK của RLS)
            foreach (var (collection, e, op) in ops.Where(o => o.E.Tenant is null)) Exec(collection, e, op);
            foreach (var g in ops.Where(o => o.E.Tenant is not null).GroupBy(o => o.E.Tenant!))
            {
                SetTenantContext(ReadTenantsNow(), g.Key); _applied = null;
                foreach (var (collection, e, op) in g) Exec(collection, e, op);
            }
            _tx.Commit();
        }
        catch
        {
            Discard();
            throw;
        }
        Release();
    }

    private void Exec(string collection, Entry e, char op)
    {
        var table = DocumentCatalog.Table(collection);
        var tenant = e.Tenant;
        var sql = op switch
        {
            'I' => tenant is null ? $"INSERT INTO {table} (collection, key, doc) VALUES (@c, @k, @d)" : $"INSERT INTO {table} (collection, key, tenant_id, doc) VALUES (@c, @k, @t, @d)",
            'U' => $"UPDATE {table} SET doc = @d WHERE collection = @c AND key = @k",
            _ => $"DELETE FROM {table} WHERE collection = @c AND key = @k",
        };
        using var cmd = new NpgsqlCommand(sql, _conn, _tx);
        cmd.Parameters.AddWithValue("c", collection);
        cmd.Parameters.AddWithValue("k", e.Key);
        if (op == 'I' && tenant is not null) cmd.Parameters.AddWithValue("t", tenant);
        if (op != 'D') cmd.Parameters.Add(new NpgsqlParameter("d", NpgsqlDbType.Jsonb) { Value = Doc.Stringify(e.Doc) });
        var n = cmd.ExecuteNonQuery();
        if (n != 1 && op != 'I') throw new InvalidOperationException($"Không ghi được {collection}/{e.Key} (RLS chặn hoặc bản ghi đã thay đổi).");
    }

    public void Discard()
    {
        try { _tx?.Rollback(); } catch (Exception) { /* kết nối đã đóng */ }
        Release();
    }

    public void Dispose() => Discard();
}
