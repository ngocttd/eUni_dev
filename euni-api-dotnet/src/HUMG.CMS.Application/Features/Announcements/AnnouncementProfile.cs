using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Domain.Announcements;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Announcements;

public static class AnnouncementCatalog
{
    public static readonly (string Code, string Label)[] Categories =
        { ("general", "Chung"), ("academic", "Đào tạo"), ("exam", "Thi cử"), ("tuition", "Học phí"), ("event", "Sự kiện"), ("admin", "Hành chính") };
    public static readonly (int Code, string Label)[] Priorities = { (0, "Bình thường"), (1, "Quan trọng"), (2, "Khẩn") };
    public static readonly string[] Channels = { "portal", "email", "push" };

    public static string? CategoryLabel(string? c) => Categories.Where(x => x.Code == c).Select(x => x.Label).FirstOrDefault();
    public static string? PriorityLabel(long? p) => Priorities.Where(x => x.Code == p).Select(x => x.Label).FirstOrDefault();

    public static JsonObject CategoriesJson() { var o = new JsonObject(); foreach (var (c, l) in Categories) o[c] = l; return o; }
    public static JsonObject AudiencesJson() { var o = new JsonObject(); foreach (var (c, l) in Audiences.All) o[c] = l; return o; }
}

/// <summary>
/// Thông báo (<c>announcements</c>) — aggregate riêng với tin tức (docs/design/CMS_DESIGN.md §6): đối tượng nhận <c>targets[]</c>
/// (mỗi dòng AND audience × unitCode × userSub, các dòng OR, dòng isExclude bị trừ), receipts đã đọc / đã xác nhận, thu hồi, kênh gửi.
/// </summary>
public sealed class AnnouncementProfile : IWorkflowProfile
{
    private static readonly string[] Fields =
        { "title", "bodyHtml", "category", "priority", "ownerUnitCode", "publishAt", "expireAt", "pinnedUntil", "requireAck", "channels", "attachments", "translations" };

    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AccessService _access;
    public AnnouncementProfile(IDocumentStore store, RequestContext ctx, AccessService access) { _store = store; _ctx = ctx; _access = access; }

    public string Path => "announcements";
    public string Collection => "announcements";
    public string Type => "announcement";
    public string Label(JsonObject r) => r.Str("title") ?? "";

    private string UnitName(string? code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code)?.Str("name") ?? code ?? "";
    private JsonObject? FindUser(string? key)
    {
        var k = (key ?? "").Trim().ToLowerInvariant();
        return _store.Rows("users").FirstOrDefault(u => new[] { u.Str("sub"), u.Str("email"), u.Str("username"), u.Str("staffCode"), u.Str("studentCode") }.Any(v => !string.IsNullOrEmpty(v) && v.ToLowerInvariant() == k));
    }

    private string LabelOf(JsonObject t)
    {
        if (Doc.Truthy(t.Get("userSub")))
        {
            var u = _store.Rows("users").FirstOrDefault(x => x.Str("sub") == t.Str("userSub"));
            var code = new[] { u?.Str("staffCode"), u?.Str("studentCode"), u?.Str("email") }.FirstOrDefault(s => !string.IsNullOrEmpty(s)) ?? t.Str("userSub");
            return $"{code} – {u?.Str("fullName") ?? ""}".Trim();
        }
        var parts = new[] { Doc.Truthy(t.Get("audience")) ? Audiences.Label(t.Str("audience")!) : null, Doc.Truthy(t.Get("unitCode")) ? UnitName(t.Str("unitCode")) : null }.Where(s => s is not null);
        var l = string.Join(" · ", parts);
        return l.Length > 0 ? l : "Mọi người";
    }

    private JsonArray NormalizeTargets(JsonNode? list)
    {
        if (list is not JsonArray arr) throw HttpError.Invalid("targets phải là mảng.");
        var res = new JsonArray();
        foreach (var t in arr.Objects())
        {
            var o = new JsonObject
            {
                ["audience"] = Doc.Truthy(t.Get("audience")) ? t.Str("audience") : null, ["unitCode"] = Doc.Truthy(t.Get("unitCode")) ? t.Str("unitCode") : null,
                ["userSub"] = Doc.Truthy(t.Get("userSub")) ? t.Str("userSub") : null, ["isExclude"] = Doc.Truthy(t.Get("isExclude")),
            };
            if (o.Str("audience") is { } a && !Audiences.Exists(a)) throw HttpError.Invalid($"Đối tượng không hợp lệ: {a}.");
            if (o.Str("unitCode") is { } uc && !_store.Rows("orgUnits").Any(u => u.Str("code") == uc)) throw HttpError.Invalid($"Đơn vị không tồn tại: {uc}.");
            // nhắm cá nhân bằng mã cán bộ / mã sinh viên / email → đổi ra sub (một người dù đăng nhập M365 hay tài khoản trường)
            if (o.Str("userSub") is null && Doc.Truthy(t.Get("userKey")))
            {
                var u = FindUser(t.Str("userKey")) ?? throw HttpError.Invalid($"Không tìm thấy người dùng \"{t.Str("userKey")}\" trong danh bạ.");
                o["userSub"] = u.Str("sub");
            }
            if (o.Str("userSub") is { } us && !_store.Rows("users").Any(u => u.Str("sub") == us)) throw HttpError.Invalid($"Người dùng không tồn tại: {us}.");
            o["label"] = Doc.Truthy(t.Get("label")) ? t.Str("label") : LabelOf(o);
            res.Add(o);
        }
        return res;
    }

    public JsonObject Normalize(JsonObject b, JsonObject? existing)
    {
        var f = new JsonObject();
        foreach (var k in Fields) if (b.Has(k)) f[k] = b.Get(k)?.DeepClone();
        foreach (var k in new[] { "publishAt", "expireAt", "pinnedUntil" }) if (f.Has(k) && f.Str(k) == "") f[k] = null;
        if (existing is null && string.IsNullOrWhiteSpace(Doc.Truthy(b.Get("title")) ? b.Str("title") : null)) throw HttpError.Invalid("Thiếu tiêu đề.");
        if (f.Has("title") && string.IsNullOrWhiteSpace(Doc.Truthy(f.Get("title")) ? f.Str("title") : null)) throw HttpError.Invalid("Tiêu đề không được để trống.");
        if (Doc.Truthy(f.Get("category")) && AnnouncementCatalog.CategoryLabel(f.Str("category")) is null) throw HttpError.Invalid("Loại thông báo không hợp lệ.");
        if (f.Has("priority"))
        {
            var n = Doc.AsDouble(f.Get("priority")) ?? double.NaN;
            if (double.IsNaN(n) || (n != 0 && n != 1 && n != 2)) throw HttpError.Invalid("priority phải là 0, 1 hoặc 2.");
            f["priority"] = (long)n;
        }
        if (Doc.Truthy(f.Get("channels")) && (f.Get("channels") is not JsonArray ch || ch.Any(c => !AnnouncementCatalog.Channels.Contains(Doc.AsString(c) ?? "")))) throw HttpError.Invalid("channels chỉ gồm portal, email, push.");
        if (Doc.Truthy(f.Get("ownerUnitCode")) && !_store.Rows("orgUnits").Any(u => u.Str("code") == f.Str("ownerUnitCode"))) throw HttpError.Invalid("Đơn vị phát hành không tồn tại.");
        if (b.Has("targets")) f["targets"] = NormalizeTargets(b.Get("targets"));
        if (f.Has("requireAck")) f["requireAck"] = Doc.Truthy(f.Get("requireAck"));
        if (Doc.Truthy(f.Get("expireAt")) && Doc.Truthy(f.Get("publishAt")) && TimeUtil.Ts(f.Str("expireAt")) <= TimeUtil.Ts(f.Str("publishAt")))
            throw HttpError.Invalid("Thời gian hết hạn phải sau thời gian đăng.");
        return f;
    }

    public JsonObject Defaults() => Doc.Obj(
        ("ownerUnitCode", _ctx.User!.Units.Count > 0 && !string.IsNullOrEmpty(_ctx.User.Units[0]) ? _ctx.User.Units[0] : "HUMG"), ("category", "general"), ("priority", 0), ("bodyHtml", ""),
        ("publishAt", null), ("expireAt", null), ("pinnedUntil", null), ("requireAck", false), ("channels", Doc.ArrOf(new[] { "portal" })), ("targets", new JsonArray()),
        ("attachments", new JsonArray()), ("translations", new JsonObject()), ("recallReason", null), ("authorSub", _ctx.User.Sub), ("authorName", _ctx.User.Name));

    public string? Validate(JsonObject a)
    {
        if (string.IsNullOrWhiteSpace(a.Str("title"))) return "Thông báo chưa có tiêu đề.";
        if (!a.Get("targets").Objects().Any(t => !Doc.Truthy(t.Get("isExclude")))) return "Chưa chọn đối tượng nhận thông báo.";
        return null;
    }

    public JsonObject OnArchive(JsonObject b) => Doc.Obj(("recallReason", Doc.Truthy(b.Get("note")) ? b.Str("note") : null));

    public static List<TargetRef> TargetsOf(JsonObject a) =>
        a.Get("targets").Objects().Select(t => new TargetRef(t.Str("audience"), t.Str("unitCode"), t.Str("userSub"), Doc.Truthy(t.Get("isExclude")))).ToList();

    /// <summary>Ước tính người nhận từ danh bạ (thật: Membership API, chốt khi fan-out).</summary>
    public List<JsonObject> RecipientsOf(JsonObject a)
    {
        var targets = TargetsOf(a);
        return _store.Rows("users").Where(u => u.Long("status") == 1
            && (u.Get("tenants") is JsonArray ? u.Get("tenants").Strings() : new[] { "humg" }).Contains(a.Str("tenantId") ?? "")
            && Audiences.IsRecipient(targets, Audiences.MembershipOf(u.Str("sub") ?? "", u.Get("roles").Strings(), u.Get("units").Strings(), _access.Tree))).ToList();
    }

    public List<JsonObject> ReceiptsOf(JsonObject a) => _store.Rows("receipts").Where(r => r.Long("announcementId") == a.Long("id")).ToList();

    public JsonObject Out(JsonObject a)
    {
        var rc = ReceiptsOf(a);
        var summary = string.Join("; ", a.Get("targets").Objects().Select(t => Doc.Truthy(t.Get("isExclude")) ? $"trừ {t.Str("label")}" : t.Str("label")));
        return Doc.Obj(
            ("ownerUnitName", UnitName(a.Str("ownerUnitCode"))), ("categoryLabel", AnnouncementCatalog.CategoryLabel(a.Str("category")) ?? a.Str("category")),
            ("priorityLabel", AnnouncementCatalog.PriorityLabel(a.Long("priority"))), ("targetSummary", summary),
            ("stats", Doc.Obj(("recipients", RecipientsOf(a).Count), ("read", rc.Count(r => Doc.Truthy(r.Get("readAt")))), ("acked", rc.Count(r => Doc.Truthy(r.Get("ackedAt")))))));
    }

    public List<JsonObject> Filter(List<JsonObject> list, QueryParams q) => q.Is("category") ? list.Where(a => a.Str("category") == q["category"]).ToList() : list;
}
