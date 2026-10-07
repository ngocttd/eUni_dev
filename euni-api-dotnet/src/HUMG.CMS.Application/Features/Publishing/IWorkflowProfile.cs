using System.Text.Json.Nodes;
using HUMG.CMS.Application.Common;

namespace HUMG.CMS.Application.Features.Publishing;

/// <summary>
/// Cấu hình của một loại nội dung có workflow (tin tức, thông báo). Dùng chung một bộ quy tắc chuyển trạng thái,
/// nhưng mỗi loại là một aggregate/collection riêng (thông báo có targets, receipts, thu hồi, kênh gửi).
/// </summary>
public interface IWorkflowProfile
{
    /// <summary>Đoạn route: <c>/api/v1/admin/{Path}</c>.</summary>
    string Path { get; }
    string Collection { get; }
    /// <summary>Loại quyền (<c>news</c>, <c>announcement</c>) — tiền tố quyền chức năng và resourceType của grant.</summary>
    string Type { get; }
    string Label(JsonObject r);
    /// <summary>Kiểm tra + chuẩn hóa dữ liệu vào; ném <c>HttpError</c> 422/409.</summary>
    JsonObject Normalize(JsonObject body, JsonObject? existing);
    JsonObject Defaults();
    /// <summary>Điều kiện để gửi duyệt / xuất bản; trả thông báo lỗi hoặc null.</summary>
    string? Validate(JsonObject r);
    JsonObject OnArchive(JsonObject body);
    /// <summary>Trường dẫn xuất thêm vào response của một bản ghi.</summary>
    JsonObject Out(JsonObject r);
    List<JsonObject> Filter(List<JsonObject> list, QueryParams q);
}
