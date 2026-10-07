using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Common;

public static class Paging
{
    private static int ToInt(string? v, int d)
    {
        var n = TextUtil.ToNumber(v);
        return !double.IsNaN(n) && !double.IsInfinity(n) && n > 0 ? (int)Math.Floor(n) : d;
    }

    /// <summary>
    /// <c>{ items, pageIndex, pageSize, totalItems, totalPages }</c>. <paramref name="defaultPageSize"/> thay cho <c>{ pageSize: N, ...req.query }</c> của mock.
    /// </summary>
    public static JsonObject Paged(IReadOnlyList<JsonObject> list, QueryParams q, int? defaultPageSize = null) =>
        Paged(list, q, defaultPageSize, x => x.DeepClone());

    public static JsonObject Paged<T>(IReadOnlyList<T> list, QueryParams q, int? defaultPageSize, Func<T, JsonNode?> toNode)
    {
        var pageIndex = ToInt(q["pageIndex"], 1);
        var rawSize = q.Has("pageSize") ? q["pageSize"] : defaultPageSize?.ToString();
        var pageSize = Math.Min(ToInt(rawSize, 20), 500);
        var total = list.Count;
        var items = new JsonArray(list.Skip((pageIndex - 1) * pageSize).Take(pageSize).Select(toNode).ToArray());
        return new JsonObject
        {
            ["items"] = items,
            ["pageIndex"] = pageIndex,
            ["pageSize"] = pageSize,
            ["totalItems"] = total,
            ["totalPages"] = Math.Max(1, (int)Math.Ceiling(total / (double)pageSize)),
        };
    }

    /// <summary>Phân trang rồi biến đổi từng phần tử (vd. thêm allowedActions).</summary>
    public static JsonObject PagedMap(IReadOnlyList<JsonObject> list, QueryParams q, Func<JsonObject, JsonObject> map, int? defaultPageSize = null) =>
        Paged(list, q, defaultPageSize, x => map(x));
}
