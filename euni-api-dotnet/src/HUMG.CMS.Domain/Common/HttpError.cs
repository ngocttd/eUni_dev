namespace HUMG.CMS.Domain.Common;

/// <summary>Lỗi nghiệp vụ có mã HTTP; API trả `{ message, ...extra }`.</summary>
public class HttpError : Exception
{
    public int Status { get; }
    public IReadOnlyDictionary<string, object?>? Extra { get; }
    public HttpError(int status, string message, IReadOnlyDictionary<string, object?>? extra = null) : base(message) { Status = status; Extra = extra; }

    public static HttpError BadRequest(string m) => new(400, m);
    public static HttpError Unauthorized(string m) => new(401, m);
    public static HttpError Forbidden(string m) => new(403, m);
    public static HttpError NotFound(string m = "Không tìm thấy dữ liệu.") => new(404, m);
    public static HttpError Conflict(string m, IReadOnlyDictionary<string, object?>? extra = null) => new(409, m, extra);
    public static HttpError Invalid(string m) => new(422, m);
}
