using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Domain.Announcements;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Announcements;

/// <summary>
/// Thông báo ngoài vòng đời workflow chung: thống kê đọc/xác nhận, danh mục form soạn, và hộp thư của người dùng
/// (<c>/api/v1/me/announcements</c>) — so khớp đối tượng nhận lúc đọc với membership của user.
/// </summary>
public sealed class AnnouncementService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AccessService _access;
    private readonly AnnouncementProfile _profile;
    private readonly WorkflowService _workflow;

    public AnnouncementService(IDocumentStore store, RequestContext ctx, AccessService access, AnnouncementProfile profile, WorkflowService workflow)
    { _store = store; _ctx = ctx; _access = access; _profile = profile; _workflow = workflow; }

    // ------------------------------------------------------------ quản trị

    public JsonObject Stats(string id)
    {
        var a = _workflow.FindRecord(_profile, id);
        if (!_access.Can("announcement", "view", a)) throw HttpError.Forbidden("Bạn không có quyền \"view\" trên bản ghi này.");
        var rc = _profile.ReceiptsOf(a);
        var people = _profile.RecipientsOf(a).Select(u =>
        {
            var r = rc.FirstOrDefault(x => x.Str("userSub") == u.Str("sub"));
            return new JsonObject
            {
                ["sub"] = u.Str("sub"), ["name"] = u.Str("fullName"),
                ["code"] = Doc.Truthy(u.Get("studentCode")) ? u.Str("studentCode") : Doc.Truthy(u.Get("staffCode")) ? u.Str("staffCode") : null,
                ["units"] = u.Get("units")?.DeepClone(), ["readAt"] = r?.Get("readAt")?.DeepClone(), ["ackedAt"] = r?.Get("ackedAt")?.DeepClone(),
            };
        }).ToList();
        return new JsonObject
        {
            ["recipients"] = people.Count, ["read"] = people.Count(p => Doc.Truthy(p.Get("readAt"))), ["acked"] = people.Count(p => Doc.Truthy(p.Get("ackedAt"))),
            ["requireAck"] = a.Get("requireAck")?.DeepClone(), ["people"] = new JsonArray(people.Select(p => (JsonNode?)p).ToArray()),
        };
    }

    public static JsonObject Options()
    {
        var pr = new JsonObject(); foreach (var (c, l) in AnnouncementCatalog.Priorities) pr[c.ToString()] = l;
        return new JsonObject { ["audiences"] = AnnouncementCatalog.AudiencesJson(), ["categories"] = AnnouncementCatalog.CategoriesJson(), ["priorities"] = pr, ["channels"] = Doc.ArrOf(AnnouncementCatalog.Channels) };
    }

    // ------------------------------------------------------------ hộp thư

    private List<JsonObject> Inbox()
    {
        var t = _ctx.User!;
        var m = Audiences.MembershipOf(t.Sub, t.Roles, t.Units, _access.Tree);
        var allowed = _ctx.AllTenants ? (t.Tenants.Count > 0 ? t.Tenants.ToList() : new List<string> { "humg" }) : new List<string> { _ctx.Tenant };
        return _store.Rows("announcements").Where(a => allowed.Contains(a.Str("tenantId") ?? "") && WorkflowService.IsLive(a) && Audiences.IsRecipient(AnnouncementProfile.TargetsOf(a), m)).ToList();
    }

    private JsonObject? Receipt(JsonObject a, string sub) => _store.Rows("receipts").FirstOrDefault(r => r.Long("announcementId") == a.Long("id") && r.Str("userSub") == sub);
    private string UnitName(string? code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code)?.Str("name") ?? code ?? "";

    private JsonObject View(JsonObject a, QueryParams q)
    {
        var lang = q.Is("lang") ? q["lang"]! : "vi";
        var tr = lang != "vi" ? (a.Get("translations") as JsonObject)?.Get(lang) as JsonObject : null;
        var ok = tr is not null && tr.Str("status") == "done" && Doc.Truthy(tr.Get("title"));
        var r = Receipt(a, _ctx.User!.Sub);
        return new JsonObject
        {
            ["id"] = a.Long("id"), ["tenantId"] = a.Str("tenantId"), ["title"] = ok ? tr!.Str("title") : a.Str("title"),
            ["bodyHtml"] = ok && Doc.Truthy(tr!.Get("bodyHtml")) ? tr.Str("bodyHtml") : a.Str("bodyHtml"), ["language"] = ok ? lang : "vi",
            ["category"] = a.Str("category"), ["categoryLabel"] = AnnouncementCatalog.CategoryLabel(a.Str("category")), ["priority"] = a.Long("priority"),
            ["priorityLabel"] = AnnouncementCatalog.PriorityLabel(a.Long("priority")), ["ownerUnitCode"] = a.Str("ownerUnitCode"), ["ownerUnitName"] = UnitName(a.Str("ownerUnitCode")),
            ["publishAt"] = a.Get("publishAt")?.DeepClone(), ["expireAt"] = a.Get("expireAt")?.DeepClone(),
            ["pinned"] = Doc.Truthy(a.Get("pinnedUntil")) && TimeUtil.Ts(a.Str("pinnedUntil")) > TimeUtil.NowMs(),
            ["requireAck"] = a.Get("requireAck")?.DeepClone(), ["attachments"] = a.Get("attachments") is JsonArray ? a.Get("attachments")!.DeepClone() : new JsonArray(),
            ["readAt"] = r?.Get("readAt")?.DeepClone(), ["ackedAt"] = r?.Get("ackedAt")?.DeepClone(),
        };
    }

    public JsonObject MyList(QueryParams q)
    {
        var list = Inbox().Select(a => View(a, q)).ToList();
        var unread = list.Count(x => !Doc.Truthy(x.Get("readAt")));
        if (q["unread"] == "true") list = list.Where(x => !Doc.Truthy(x.Get("readAt"))).ToList();
        if (q.Is("category")) list = list.Where(x => x.Str("category") == q["category"]).ToList();
        list = list.OrderByDescending(x => Doc.Truthy(x.Get("pinned")) ? 1 : 0).ThenByDescending(x => x.Long("priority") ?? 0)
            .ThenByDescending(x => x.Str("publishAt") ?? "null", StringComparer.Ordinal).ToList();
        var page = Paging.Paged(list, q, 50);
        page["unreadCount"] = unread; page["categories"] = AnnouncementCatalog.CategoriesJson();
        return page;
    }

    public JsonObject UnreadCount() => new() { ["unread"] = Inbox().Count(a => !Doc.Truthy(Receipt(a, _ctx.User!.Sub)?.Get("readAt"))) };

    private JsonObject InboxItem(string id) =>
        Inbox().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound("Không có thông báo này trong hộp thư của bạn.");

    public JsonObject MyOne(string id, QueryParams q) => View(InboxItem(id), q);

    public JsonObject Mark(string id, bool ack, QueryParams q)
    {
        var a = InboxItem(id);
        var r = Receipt(a, _ctx.User!.Sub) ?? _store.Insert("receipts", Doc.Obj(("tenantId", a.Str("tenantId")), ("announcementId", a.Long("id")), ("userSub", _ctx.User.Sub), ("deliveredAt", null), ("readAt", null), ("ackedAt", null)));
        if (!Doc.Truthy(r.Get("readAt"))) r["readAt"] = TimeUtil.NowIso();
        if (ack && !Doc.Truthy(r.Get("ackedAt"))) r["ackedAt"] = TimeUtil.NowIso();
        _store.MarkDirty();
        return View(a, q);
    }

    public JsonObject ReadAll()
    {
        var n = 0;
        foreach (var a in Inbox())
        {
            var r = Receipt(a, _ctx.User!.Sub);
            if (r is not null && Doc.Truthy(r.Get("readAt"))) continue;
            if (r is not null) r["readAt"] = TimeUtil.NowIso();
            else _store.Insert("receipts", Doc.Obj(("tenantId", a.Str("tenantId")), ("announcementId", a.Long("id")), ("userSub", _ctx.User!.Sub), ("deliveredAt", null), ("readAt", TimeUtil.NowIso()), ("ackedAt", null)));
            n++;
        }
        _store.MarkDirty();
        return new JsonObject { ["marked"] = n };
    }
}
