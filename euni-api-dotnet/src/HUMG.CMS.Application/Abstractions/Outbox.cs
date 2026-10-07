using System.Text.Json.Nodes;

namespace HUMG.CMS.Application.Abstractions;

/// <summary>Sự kiện ghi vào bảng outbox CÙNG transaction với thay đổi dữ liệu (không mất sự kiện khi use case rollback, không phát sự kiện khi dữ liệu chưa commit).</summary>
public sealed record OutboxMessage(long Id, string TenantId, string Type, JsonObject Payload, int Attempts);

/// <summary>Xử lý một loại sự kiện outbox (xóa cache, fan-out thông báo, gửi sang dịch vụ khác). Ném lỗi → thử lại với độ trễ tăng dần.</summary>
public interface IOutboxHandler
{
    bool Handles(string type);
    Task HandleAsync(OutboxMessage message, CancellationToken ct);
}
