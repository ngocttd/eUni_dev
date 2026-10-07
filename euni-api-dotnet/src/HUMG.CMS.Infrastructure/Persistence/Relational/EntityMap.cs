using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Persistence.Relational;

/// <summary>Một tài liệu đã nạp: khóa dòng, nội dung, tenant (null nếu dữ liệu dùng chung).</summary>
public sealed record Loaded(string Key, JsonNode Doc, string? Tenant);

/// <summary>
/// Ánh xạ một collection của API (tài liệu JSON theo hợp đồng) sang các bảng quan hệ của lược đồ v2: bảng cha, bảng bản dịch, bảng con.
/// Trường không có cột riêng được lưu lossless trong cột <c>extra jsonb</c> của bảng cha.
/// </summary>
public abstract class EntityMap
{
    public abstract string Collection { get; }
    /// <summary>Dữ liệu dùng chung (không RLS): tenant, danh bạ, cây đơn vị, ngôn ngữ, sao lưu, metadata.</summary>
    public virtual bool Global => false;
    /// <summary>Bảng dùng chung nhiều collection (home_blocks, media_items): id gán lại khi nhập để không trùng nhau.</summary>
    public virtual bool RemapIdsOnImport => false;

    public abstract List<Loaded> Load(Db db);
    public abstract void Save(Db db, JsonNode doc);
    public abstract void Delete(Db db, JsonNode doc);
    public abstract void DeleteAll(Db db);
    public virtual long NextId(Db db) => throw new NotSupportedException($"{Collection} không cấp id số.");
    /// <summary>Bảng có cột identity cần đặt lại bộ đếm sau khi nhập.</summary>
    public virtual IEnumerable<string> IdentityTables => Enumerable.Empty<string>();
}

/// <summary>Ánh xạ bảng cha theo danh sách cột; lớp con thêm bảng bản dịch / bảng con qua các hook.</summary>
public class TableMap : EntityMap
{
    private readonly string _collection;
    public TableMap(string collection, string table, Col[] cols, string idColumn = "id", string keyField = "id", bool identity = true, bool global = false,
        string? kindColumn = null, string? kindValue = null, bool hasExtra = true, string? orderBy = null, bool remap = false, string extraColumn = "extra")
    {
        _collection = collection; Table = table; Cols = cols; IdColumn = idColumn; KeyField = keyField; Identity = identity; _global = global;
        KindColumn = kindColumn; KindValue = kindValue; HasExtra = hasExtra; ExtraColumn = extraColumn; OrderBy = orderBy ?? idColumn; _remap = remap;
    }

    private readonly bool _global, _remap;
    public override string Collection => _collection;
    public override bool Global => _global;
    public override bool RemapIdsOnImport => _remap;
    public string Table { get; }
    public Col[] Cols { get; }
    public string IdColumn { get; }
    public string KeyField { get; }
    public bool Identity { get; }
    public string? KindColumn { get; }
    public string? KindValue { get; }
    public bool HasExtra { get; }
    public string ExtraColumn { get; }
    public string OrderBy { get; }
    public bool HasTenant => Cols.Any(c => c.Column == "tenant_id");
    private Col IdCol => Cols.First(c => c.Column == IdColumn);

    public override IEnumerable<string> IdentityTables => Identity ? new[] { Table } : Enumerable.Empty<string>();

    /// <summary>Trường do bảng bản dịch/bảng con xử lý (không đưa vào extra).</summary>
    protected virtual string[] ConsumedFields => Array.Empty<string>();
    /// <summary>Bổ sung các trường từ bảng con vào tài liệu đã nạp (docs theo id cột khóa).</summary>
    protected virtual void ReadChildren(Db db, List<JsonObject> docs) { }
    protected virtual void WriteChildren(Db db, JsonObject doc) { }
    /// <summary>Chuẩn hóa tài liệu trước khi ghi cột (vd. tính cột dẫn xuất).</summary>
    protected virtual void BeforeWrite(JsonObject doc) { }
    /// <summary>Chỉnh tài liệu sau khi nạp từ cột (vd. dựng url từ object_key).</summary>
    protected virtual void AfterRead(JsonObject doc) { }
    protected virtual string SelectSql(string columns) => $"SELECT {columns} FROM {Table}{WhereKind()} ORDER BY {OrderBy}";
    private string WhereKind() => KindColumn is null ? "" : $" WHERE {KindColumn} = '{KindValue}'";

    protected IEnumerable<Col> ReadCols => Cols.Where(c => !c.Hide);

    public override List<Loaded> Load(Db db)
    {
        var cols = ReadCols.ToList();
        var sel = string.Join(", ", cols.Select(c => c.Select()));
        if (HasExtra) sel += $", {ExtraColumn}::text";
        var docs = new List<JsonObject>();
        foreach (var row in db.Query(SelectSql(sel)))
        {
            var o = new JsonObject();
            for (var i = 0; i < cols.Count; i++) o[cols[i].Field] = cols[i].FromDb(row[i]);
            if (HasExtra && row[cols.Count] is string ex && JsonNode.Parse(ex) is JsonObject eo) foreach (var kv in eo) o[kv.Key] = kv.Value?.DeepClone();
            docs.Add(o);
        }
        ReadChildren(db, docs);
        return docs.Select(d =>
        {
            AfterRead(d);
            return new Loaded(Doc.AsString(d.Get(KeyField)) ?? "", d, Global || !HasTenant ? null : d.Str("tenantId"));
        }).ToList();
    }

    public override void Save(Db db, JsonNode node)
    {
        var doc = (JsonObject)node.DeepClone();
        BeforeWrite(doc);
        var mapped = new HashSet<string>(Cols.Select(c => c.Field).Concat(ConsumedFields));
        var names = new List<string>(); var vals = new List<string>(); var ps = new List<(string, object?)>();
        for (var i = 0; i < Cols.Length; i++)
        {
            var c = Cols[i]; var p = "@c" + i;
            names.Add(c.Column); vals.Add(c.Cast(p));
            var v = c.ToDb(doc.Get(c.Field));
            ps.Add((p, c.Type == CT.Json && v is null ? DBNull.Value : v));
        }
        if (KindColumn is not null) { names.Add(KindColumn); vals.Add($"'{KindValue}'"); }
        if (HasExtra)
        {
            var extra = new JsonObject();
            foreach (var kv in doc) if (!mapped.Contains(kv.Key)) extra[kv.Key] = kv.Value?.DeepClone();
            names.Add(ExtraColumn); vals.Add("@extra::jsonb"); ps.Add(("@extra", Doc.Stringify(extra)));
        }
        var updates = string.Join(", ", names.Where(n => n != IdColumn && n != KindColumn).Select(n => $"{n} = EXCLUDED.{n}"));
        var over = Identity ? " OVERRIDING SYSTEM VALUE" : "";
        db.Exec($"INSERT INTO {Table} ({string.Join(", ", names)}){over} VALUES ({string.Join(", ", vals)}) ON CONFLICT ({IdColumn}) DO UPDATE SET {updates}", ps.ToArray());
        WriteChildren(db, doc);
    }

    public override void Delete(Db db, JsonNode doc)
    {
        var id = IdCol.ToDb(((JsonObject)doc).Get(IdCol.Field));
        db.Exec($"DELETE FROM {Table} WHERE {IdColumn} = @id", ("@id", id));
    }

    public override void DeleteAll(Db db) => db.Exec($"DELETE FROM {Table}{WhereKind()}");

    public override long NextId(Db db) => Convert.ToInt64(db.Scalar($"SELECT nextval(pg_get_serial_sequence('{Table}', '{IdColumn}'))"));

    // ------------------------------------------------------------ tiện ích cho lớp con

    protected static Dictionary<long, List<object?[]>> GroupBy(List<object?[]> rows, int fkIndex = 0)
    {
        var d = new Dictionary<long, List<object?[]>>();
        foreach (var r in rows) { var k = Convert.ToInt64(r[fkIndex]); if (!d.TryGetValue(k, out var l)) d[k] = l = new(); l.Add(r); }
        return d;
    }
    protected static string? S(object? v) => v as string;
    protected static JsonNode? J(object? v) => v is string s ? JsonValue.Create(s) : null;
    protected static string? Strip(string? html) => html is null ? null : System.Text.RegularExpressions.Regex.Replace(html, "<[^>]+>", " ");
    protected static string Trunc(string? s, int n) => s is null ? "" : s.Length <= n ? s : s[..n];
    protected static void Put(JsonObject o, string key, string? v) { if (v is not null) o[key] = v; }
    protected static string? Str(JsonObject o, string key) => Doc.Truthy(o.Get(key)) || o.Get(key) is JsonValue ? Doc.AsString(o.Get(key)) : null;
}
