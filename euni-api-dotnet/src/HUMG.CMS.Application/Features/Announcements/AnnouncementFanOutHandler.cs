using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using Microsoft.Extensions.DependencyInjection;

namespace HUMG.CMS.Application.Features.Announcements;

/// <summary>
/// Khi thông báo ĐẾN GIỜ xuất bản (outbox <c>AnnouncementPublished</c> có availableAt = publishAt): chốt số người nhận
/// (<c>announcements.recipient_count</c>) từ danh bạ + đối tượng nhận. Kênh email/push sẽ gắn ở đây khi có hạ tầng gửi.
/// Chạy trong scope riêng với ngữ cảnh tenant của thông báo (RLS vẫn áp dụng).
/// </summary>
public sealed class AnnouncementFanOutHandler : IOutboxHandler
{
    private readonly IServiceScopeFactory _scopes;
    public AnnouncementFanOutHandler(IServiceScopeFactory scopes) => _scopes = scopes;

    public bool Handles(string type) => type == "AnnouncementPublished";

    public Task HandleAsync(OutboxMessage m, CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var sp = scope.ServiceProvider;
        sp.GetRequiredService<RequestContext>().Tenant = m.TenantId;
        var store = sp.GetRequiredService<IDocumentStore>();
        var id = m.Payload.Long("entityId");
        var a = store.Rows("announcements").FirstOrDefault(x => x.Long("id") == id);
        if (a is null || Doc.Truthy(a.Get("deletedAt")) || a.Str("status") != "published") return Task.CompletedTask;   // đã gỡ/xóa trước khi đến giờ
        var count = sp.GetRequiredService<AnnouncementProfile>().RecipientsOf(a).Count;
        store.Update("announcements", a.Id(), Doc.Obj(("recipientCount", count)));
        store.Flush();
        return Task.CompletedTask;
    }
}
