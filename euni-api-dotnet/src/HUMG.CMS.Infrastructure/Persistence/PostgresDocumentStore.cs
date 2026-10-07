using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence.Relational;
using Npgsql;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>
/// Unit-of-work của một request trên lược đồ quan hệ v2 của PostgreSQL: đọc trực tiếp từ các bảng (qua <see cref="EntityMap"/>),
/// theo dõi thay đổi trên các tài liệu đã nạp, rồi ghi tất cả (nội dung + bản dịch + revision + workflow history + audit + outbox…)
/// trong MỘT transaction ở <see cref="Flush"/>. Transaction mang ngữ cảnh tenant cho Row-Level Security:
/// <c>app.tenant_ids</c> (được đọc) và <c>app.tenant_id</c> (đang ghi, đặt theo từng nhóm bản ghi).
/// </summary>
public sealed class PostgresDocumentStore : IDocumentStore, IDisposable
{
    private sealed class Entry
    {
        public required string Key;
        public required JsonNode Doc;
        public string? Original;      // null = bản ghi mới
        public bool Deleted;
        public string? Tenant;        // null với dữ liệu dùng chung
    }

    private readonly NpgsqlDataSource _source;
    private readonly RequestContext _ctx;
    private NpgsqlConnection? _conn;
    private NpgsqlTransaction? _tx;
    private string? _applied;
    private readonly Dictionary<string, List<Entry>> _cache = new();
    private readonly List<Func<Task>> _compensations = new();

    public PostgresDocumentStore(NpgsqlDataSource appSource, RequestContext ctx) { _source = appSource; _ctx = ctx; }

    // ------------------------------------------------------------ kết nối + ngữ cảnh tenant

    private string ReadTenantsNow() => string.Join(',', _ctx.ReadTenants is { Count: > 0 } r ? r : new[] { _ctx.Tenant });

    /// <summary>Mở transaction khi cần và bảo đảm ngữ cảnh tenant (đọc/ghi) khớp RequestContext — tenant được xác định sau khi store đã mở.</summary>
    private Db Db()
    {
        if (_tx is null) { _conn = _source.OpenConnection(); _tx = _conn.BeginTransaction(); _applied = null; }
        var key = $"{ReadTenantsNow()}|{_ctx.Tenant}";
        if (_applied != key) { SetTenantContext(ReadTenantsNow(), _ctx.Tenant); _applied = key; }
        return new Db(_conn!, _tx);
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
        list = DocumentCatalog.Map(collection).Load(Db())
            .Select(l => new Entry { Key = l.Key, Doc = l.Doc, Original = Doc.Stringify(l.Doc), Tenant = l.Tenant }).ToList();
        _cache[collection] = list;
        return list;
    }

    public List<JsonObject> Rows(string collection) => Load(collection).Where(e => !e.Deleted && e.Doc is JsonObject).Select(e => (JsonObject)e.Doc).ToList();

    // ------------------------------------------------------------ ghi (gom trong bộ nhớ, ghi ở Flush)

    public JsonObject Insert(string collection, JsonObject data)
    {
        var list = Load(collection);
        var id = DocumentCatalog.Map(collection).NextId(Db());
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

    public void OnDiscard(Func<Task> compensation) => _compensations.Add(compensation);

    // ------------------------------------------------------------ commit / rollback

    public void Flush()
    {
        if (_tx is null) { _compensations.Clear(); return; }
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
            var db = new Db(_conn!, _tx);
            // dữ liệu dùng chung trước, sau đó từng tenant (đặt app.tenant_id đúng tenant của bản ghi để qua WITH CHECK của RLS)
            foreach (var (collection, e, op) in ops.Where(o => o.E.Tenant is null)) Persist(db, collection, e, op);
            foreach (var g in ops.Where(o => o.E.Tenant is not null).GroupBy(o => o.E.Tenant!))
            {
                SetTenantContext(ReadTenantsNow() + (ReadTenantsNow().Split(',').Contains(g.Key) ? "" : "," + g.Key), g.Key); _applied = null;   // tenant đang ghi luôn đọc được (bảng con kiểm tra bản ghi cha qua RLS)
                foreach (var (collection, e, op) in g) Persist(db, collection, e, op);
            }
            _tx.Commit();
        }
        catch (Exception ex)
        {
            var translated = Translate(ex);
            try { Discard(); }
            catch (AggregateException comp) { throw new AggregateException("Ghi dữ liệu thất bại và bù trừ cũng thất bại.", new[] { translated }.Concat(comp.InnerExceptions)); }
            throw translated is HttpError ? translated : ex == translated ? System.Runtime.ExceptionServices.ExceptionDispatchInfo.Capture(ex).SourceException : translated;
        }
        _compensations.Clear();
        Release();
    }

    private static void Persist(Db db, string collection, Entry e, char op)
    {
        var map = DocumentCatalog.Map(collection);
        switch (map)
        {
            case SettingsMap s: if (op == 'D') s.Delete(db, e.Key); else s.Save(db, e.Key, (JsonObject)e.Doc); break;
            case MetaMap m: if (op == 'D') m.Delete(db, e.Key); else m.Save(db, e.Key, e.Doc); break;
            default: if (op == 'D') map.Delete(db, e.Doc); else map.Save(db, e.Doc); break;
        }
    }

    /// <summary>Lỗi ràng buộc của PostgreSQL → lỗi nghiệp vụ có mã HTTP.</summary>
    private static Exception Translate(Exception ex) => ex is PostgresException pg ? pg.SqlState switch
    {
        "23505" => HttpError.Conflict($"Dữ liệu bị trùng ({pg.ConstraintName ?? "khóa duy nhất"}) — slug hoặc mã đã được dùng."),
        "23503" => HttpError.Invalid("Tham chiếu không hợp lệ: bản ghi liên quan không tồn tại."),
        "23502" or "23514" or "22P02" or "22007" or "22008" or "22001" or "22003" => HttpError.Invalid($"Dữ liệu không hợp lệ ({pg.ConstraintName ?? pg.ColumnName ?? pg.MessageText})."),
        "42501" => HttpError.Forbidden("Không được ghi dữ liệu của trang này."),
        _ => ex,
    } : ex;

    public void Discard()
    {
        try { _tx?.Rollback(); } catch (Exception) { /* kết nối đã đóng */ }
        Release();
        RunCompensations();
    }

    /// <summary>Bù trừ tác vụ ngoài database (vd. xóa file đã tải lên object storage) khi transaction bị hủy. Lỗi bù trừ KHÔNG bị nuốt.</summary>
    private void RunCompensations()
    {
        if (_compensations.Count == 0) return;
        var todo = _compensations.ToList(); _compensations.Clear();
        var errors = new List<Exception>();
        foreach (var c in todo) { try { c().GetAwaiter().GetResult(); } catch (Exception e) { errors.Add(e); } }
        if (errors.Count > 0) throw new AggregateException("Bù trừ sau khi rollback thất bại (file có thể còn sót trên object storage).", errors);
    }

    public void Dispose()
    {
        try { Discard(); }
        catch (AggregateException e) { Console.Error.WriteLine($"[CẢNH BÁO] {e.Message}: {string.Join("; ", e.InnerExceptions.Select(x => x.Message))}"); }   // Dispose không ném, nhưng không im lặng
    }
}
