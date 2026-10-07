using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace HUMG.CMS.Domain.Common;

/// <summary>
/// Bản ghi CMS dạng tài liệu JSON (giữ đúng hình dạng của hợp đồng API). Các hàm bổ trợ mô phỏng ngữ nghĩa JS mà mock Node dựa vào.
/// </summary>
public static class Doc
{
    /// <summary>Tùy chọn xuất JSON giống <c>JSON.stringify</c>: không escape ký tự Unicode/HTML.</summary>
    public static readonly JsonSerializerOptions Raw = new() { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping, TypeInfoResolver = new System.Text.Json.Serialization.Metadata.DefaultJsonTypeInfoResolver() };
    public static string Stringify(JsonNode? n) => n?.ToJsonString(Raw) ?? "null";

    public static JsonNode? Get(this JsonObject o, string key) => o.TryGetPropertyValue(key, out var v) ? v : null;
    public static bool Has(this JsonObject o, string key) => o.ContainsKey(key);
    public static bool IsNullish(this JsonObject o, string key) => !o.TryGetPropertyValue(key, out var v) || v is null;

    public static string? Str(this JsonObject o, string key) => AsString(o.Get(key));
    public static string? AsString(JsonNode? n)
    {
        if (n is null) return null;
        if (n is JsonValue v)
            return v.TryGetValue<string>(out var s) ? s : v.ToJsonString(Raw);
        return n.ToJsonString(Raw);
    }

    public static long? Long(this JsonObject o, string key) => AsLong(o.Get(key));
    public static long? AsLong(JsonNode? n)
    {
        var d = AsDouble(n);
        return d is null || double.IsNaN(d.Value) ? null : (long)d.Value;
    }
    public static double? AsDouble(JsonNode? n)
    {
        if (n is not JsonValue v) return null;
        // JsonValue tạo từ C# giữ nguyên kiểu gốc (int/long/…); JsonValue đọc từ JSON là JsonElement — xử lý cả hai
        if (v.TryGetValue<int>(out var i)) return i;
        if (v.TryGetValue<long>(out var l)) return l;
        if (v.TryGetValue<double>(out var d)) return d;
        if (v.TryGetValue<decimal>(out var m)) return (double)m;
        if (v.TryGetValue<string>(out var s)) { var x = TextUtil.ToNumber(s); return double.IsNaN(x) ? null : x; }
        return null;
    }

    /// <summary>Truthy theo JS (null/false/0/"" là falsy).</summary>
    public static bool Truthy(JsonNode? n)
    {
        if (n is null) return false;
        if (n is JsonValue v)
        {
            if (v.TryGetValue<bool>(out var b)) return b;
            if (v.TryGetValue<string>(out var s)) return s.Length > 0;
            if (AsDouble(v) is { } d) return d != 0 && !double.IsNaN(d);
        }
        return true;
    }
    public static bool Flag(this JsonObject o, string key) => Truthy(o.Get(key));

    public static JsonObject ObjOrNew(this JsonObject o, string key) => o.Get(key) as JsonObject ?? new JsonObject();
    public static IEnumerable<JsonObject> Objects(this JsonNode? n) => n is JsonArray a ? a.OfType<JsonObject>() : Enumerable.Empty<JsonObject>();
    public static IEnumerable<string> Strings(this JsonNode? n) => n is JsonArray a ? a.Select(AsString).Where(s => s is not null).Select(s => s!) : Enumerable.Empty<string>();

    /// <summary>Id số của bản ghi (cột `id`).</summary>
    public static long Id(this JsonObject o) => o.Long("id") ?? 0;
    /// <summary>`r.id === Number(raw)`</summary>
    public static bool IdIs(this JsonObject o, string? raw) { var n = TextUtil.ToNumber(raw); return !double.IsNaN(n) && o.Long("id") is { } id && id == n; }

    public static JsonNode? Clone(this JsonNode? n) => n?.DeepClone();
    public static JsonObject Copy(this JsonObject o) => (JsonObject)o.DeepClone();

    /// <summary>`{ ...a, ...b, ... }` — trộn nông, sao chép giá trị.</summary>
    public static JsonObject Merge(params JsonObject?[] parts)
    {
        var r = new JsonObject();
        foreach (var p in parts) if (p is not null) foreach (var kv in p) r[kv.Key] = kv.Value?.DeepClone();
        return r;
    }

    /// <summary>Gán cây JSON từ giá trị C# (sao chép nếu là JsonNode).</summary>
    public static JsonNode? J(object? v) => v switch
    {
        null => null,
        JsonNode n => n.DeepClone(),
        string s => JsonValue.Create(s),
        bool b => JsonValue.Create(b),
        int i => JsonValue.Create(i),
        long l => JsonValue.Create(l),
        double d => JsonValue.Create(d),
        IEnumerable<string> ss => new JsonArray(ss.Select(x => (JsonNode?)JsonValue.Create(x)).ToArray()),
        _ => JsonSerializer.SerializeToNode(v),
    };

    public static JsonObject Obj(params (string Key, object? Value)[] kv)
    {
        var o = new JsonObject();
        foreach (var (k, v) in kv) o[k] = J(v);
        return o;
    }

    public static JsonArray Arr(IEnumerable<JsonNode?> items) => new(items.Select(i => i?.DeepClone()).ToArray());
    public static JsonArray ArrOf(IEnumerable<string> items) => new(items.Select(x => (JsonNode?)JsonValue.Create(x)).ToArray());

    /// <summary>So sánh JSON theo giá trị, KHÔNG phụ thuộc thứ tự khóa (jsonb của PostgreSQL không giữ thứ tự khóa).</summary>
    public static bool SameJson(JsonNode? a, JsonNode? b) => Canonical(a) == Canonical(b);

    private static string Canonical(JsonNode? n) => Stringify(Sorted(n));
    private static JsonNode? Sorted(JsonNode? n) => n switch
    {
        JsonObject o => new JsonObject(o.OrderBy(kv => kv.Key, StringComparer.Ordinal).Select(kv => KeyValuePair.Create(kv.Key, Sorted(kv.Value)))),
        JsonArray a => new JsonArray(a.Select(Sorted).ToArray()),
        null => null,
        _ => n.DeepClone(),
    };

    /// <summary>`String(x)` cho khóa so sánh id/scope.</summary>
    public static string KeyOf(JsonNode? n) => AsString(n) ?? "";
}
