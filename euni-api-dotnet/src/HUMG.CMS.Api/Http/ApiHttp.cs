using System.Text.Json;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Api.Http;

/// <summary>Phản hồi JSON giữ nguyên hình dạng hợp đồng (không escape Unicode, null được giữ).</summary>
public sealed class JsonResult : IResult
{
    private readonly int _status;
    private readonly JsonNode? _body;
    private readonly long? _etag;
    public JsonResult(int status, JsonNode? body, long? etag = null) { _status = status; _body = body; _etag = etag; }

    public async Task ExecuteAsync(HttpContext http)
    {
        http.Response.StatusCode = _status;
        if (_etag is not null) http.Response.Headers.ETag = $"\"{_etag}\"";
        if (_status == 204 || _body is null && _status != 200) return;
        http.Response.ContentType = "application/json; charset=utf-8";
        var node = _body is { Parent: not null } ? _body.DeepClone() : _body;
        await http.Response.WriteAsync(node is null ? "null" : node.ToJsonString(Doc.Raw), http.RequestAborted);
    }
}

public static class R
{
    public static IResult Ok(JsonNode? body) => new JsonResult(200, body);
    public static IResult Of(ServiceResult r) => new JsonResult(r.Status, r.Body, r.ETag);
    public static IResult Status(int status, JsonNode? body) => new JsonResult(status, body);
    public static IResult NoContent() => new JsonResult(204, null);
}

public static class RequestExtensions
{
    public static QueryParams Query(this HttpContext http) =>
        new(http.Request.Query.Where(kv => kv.Value.Count > 0).Select(kv => new KeyValuePair<string, string>(kv.Key, kv.Value[0] ?? "")));

    /// <summary>Body JSON dạng object (rỗng nếu không có / không phải JSON object), như <c>express.json()</c>.</summary>
    public static async Task<JsonObject> BodyAsync(this HttpContext http)
    {
        var ct = http.Request.ContentType ?? "";
        if (!ct.Contains("json", StringComparison.OrdinalIgnoreCase)) return new JsonObject();
        using var sr = new StreamReader(http.Request.Body);
        var text = await sr.ReadToEndAsync();
        if (string.IsNullOrWhiteSpace(text)) return new JsonObject();
        try { return JsonNode.Parse(text) as JsonObject ?? new JsonObject(); }
        catch (JsonException) { throw HttpError.BadRequest("Nội dung JSON không hợp lệ."); }
    }
}
