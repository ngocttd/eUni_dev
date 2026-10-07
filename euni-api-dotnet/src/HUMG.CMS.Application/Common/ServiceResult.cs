using System.Text.Json.Nodes;

namespace HUMG.CMS.Application.Common;

/// <summary>Kết quả use case cần mã HTTP khác 200 hoặc header ETag (giá trị = version bản ghi).</summary>
public sealed record ServiceResult(int Status, JsonNode? Body, long? ETag = null)
{
    public static ServiceResult Ok(JsonNode? body, long? etag = null) => new(200, body, etag);
    public static ServiceResult NoContent() => new(204, null);
}
