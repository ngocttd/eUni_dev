namespace HUMG.CMS.Application.Common;

/// <summary>Tham số query (lấy giá trị đầu tiên, như <c>req.query</c> của Express).</summary>
public sealed class QueryParams
{
    private readonly Dictionary<string, string> _d;
    public QueryParams(IEnumerable<KeyValuePair<string, string>>? items = null) => _d = items is null ? new() : new(items);
    public static QueryParams Empty { get; } = new();
    public string? this[string key] => _d.TryGetValue(key, out var v) ? v : null;
    public bool Has(string key) => _d.ContainsKey(key);
    public IEnumerable<KeyValuePair<string, string>> Items => _d;
    /// <summary>Có và không rỗng (JS: truthy).</summary>
    public bool Is(string key) => !string.IsNullOrEmpty(this[key]);
}
