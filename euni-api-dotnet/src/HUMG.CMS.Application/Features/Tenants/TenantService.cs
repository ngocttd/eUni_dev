using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Tenants;

/// <summary>
/// Trang đơn vị (tenant): Trường, Khoa, Phòng ban… mỗi trang có website + dữ liệu CMS riêng (docs/design/CMS_DESIGN.md §2).
/// Không xóa cứng: tắt trang (<c>isActive=false</c>) thì website + API công khai của trang ngừng phục vụ.
/// </summary>
public sealed class TenantService
{
    public const string DefaultTenant = "humg";
    private static readonly Regex IdRe = new("^[a-z][a-z0-9-]{1,31}$", RegexOptions.Compiled);
    private static readonly Regex HostRe = new(@"^[a-z0-9.-]+(:\d+)?$", RegexOptions.Compiled);
    private static readonly Regex AdminTenantsPath = new(@"/api/v1/admin/tenants(/|$)", RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AuditService _audit;
    public TenantService(IDocumentStore store, RequestContext ctx, AuditService audit) { _store = store; _ctx = ctx; _audit = audit; }

    public List<JsonObject> All() => _store.Rows("tenants");
    private static bool Active(JsonObject t) => !(t.Get("isActive") is JsonValue v && v.TryGetValue<bool>(out var b) && !b);
    public JsonObject? ActiveById(string? id) => All().FirstOrDefault(t => t.Str("id") == id && Active(t));

    public string RootUnitOf(string tenant) => ActiveById(tenant)?.Str("rootUnit") is { Length: > 0 } r ? r : "HUMG";

    /// <summary>
    /// Xác định tenant của request: header X-Tenant → host của request (bảng domain) → tenant mặc định.
    /// Trả (tenant, allTenants); ném 400 khi X-Tenant không tồn tại hoặc đã tắt.
    /// </summary>
    public (string Tenant, bool AllTenants) Resolve(string? xTenant, string? host, string path)
    {
        var header = (xTenant ?? "").Trim().ToLowerInvariant();
        if (header == "*") return (DefaultTenant, true);
        // quản lý trang đơn vị (/admin/tenants) áp dụng cho mọi trang, kể cả trang đang tắt: không chặn theo X-Tenant
        if (AdminTenantsPath.IsMatch(path)) return (ActiveById(header) is not null ? header : DefaultTenant, false);
        if (header.Length > 0)
        {
            if (ActiveById(header) is null) throw HttpError.BadRequest($"Tenant \"{header}\" không tồn tại hoặc đã tắt.");
            return (header, false);
        }
        var h = (host ?? "").ToLowerInvariant();
        var hit = All().FirstOrDefault(t => Active(t) && t.Get("domains").Strings().Contains(h));
        return (hit?.Str("id") ?? DefaultTenant, false);
    }

    private JsonObject? Unit(string? code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code);

    private static List<string> NormHosts(JsonNode? v)
    {
        IEnumerable<string> raw = v is JsonArray a ? a.Select(x => Doc.AsString(x) ?? "") : Regex.Split(Doc.AsString(v) ?? "", @"[\s,]+");
        return raw.Select(h => Regex.Replace(Regex.Replace(h.Trim().ToLowerInvariant(), "^https?://", ""), "/.*$", "")).Where(h => h.Length > 0).Distinct().ToList();
    }

    private string? Validate(JsonObject b, string? id)
    {
        if (b.Has("name") && string.IsNullOrWhiteSpace(b.Str("name"))) return "Thiếu tên trang.";
        if (Doc.Truthy(b.Get("rootUnit")) && Unit(b.Str("rootUnit")) is null) return $"Đơn vị gốc \"{b.Str("rootUnit")}\" không có trong cây đơn vị.";
        if (Doc.Truthy(b.Get("domains")))
        {
            var hosts = NormHosts(b.Get("domains"));
            var bad = hosts.FirstOrDefault(h => !HostRe.IsMatch(h));
            if (bad is not null) return $"Tên miền \"{bad}\" không hợp lệ.";
            var taken = hosts.FirstOrDefault(h => All().Any(t => t.Str("id") != id && t.Get("domains").Strings().Contains(h)));
            if (taken is not null) return $"Tên miền \"{taken}\" đang được trang khác dùng.";
        }
        return null;
    }

    private JsonObject Out(JsonObject t)
    {
        var id = t.Str("id");
        int Count(string col) => _store.Rows(col).Count(c => c.Str("tenantId") == id && !Doc.Truthy(c.Get("deletedAt")));
        return new JsonObject
        {
            ["id"] = id, ["name"] = t.Str("name"), ["rootUnit"] = t.Get("rootUnit")?.Clone(), ["rootUnitName"] = Unit(t.Str("rootUnit"))?.Str("name"),
            ["domains"] = t.Get("domains") is JsonArray ? t.Get("domains")!.Clone() : new JsonArray(), ["isActive"] = Active(t), ["createdAt"] = t.Get("createdAt")?.Clone(),
            ["stats"] = new JsonObject { ["contents"] = Count("contents"), ["pages"] = Count("pages"), ["grants"] = Count("grants") },
        };
    }

    public JsonArray List() => new(All().Select(t => (JsonNode?)Out(t)).ToArray());

    public JsonObject Create(JsonObject b)
    {
        var id = (Doc.Truthy(b.Get("id")) ? b.Str("id")! : "").Trim().ToLowerInvariant();
        if (!IdRe.IsMatch(id)) throw HttpError.Invalid("Mã trang chỉ gồm chữ thường không dấu, số, dấu gạch ngang (2–32 ký tự), bắt đầu bằng chữ.");
        if (All().Any(t => t.Str("id") == id)) throw HttpError.Conflict($"Mã trang \"{id}\" đã tồn tại.");
        if (string.IsNullOrWhiteSpace(Doc.Truthy(b.Get("name")) ? b.Str("name") : null)) throw HttpError.Invalid("Thiếu tên trang.");
        var err = Validate(b, id); if (err is not null) throw HttpError.Invalid(err);
        var ownerSub = Doc.Truthy(b.Get("ownerSub")) ? b.Str("ownerSub") : null;
        if (ownerSub is not null && !_store.Rows("users").Any(u => u.Str("sub") == ownerSub)) throw HttpError.Invalid("Người phụ trách không có trong danh bạ.");
        var actor = _ctx.User!.Sub;
        var t = new JsonObject
        {
            ["id"] = id, ["name"] = b.Str("name")!.Trim(), ["rootUnit"] = Doc.Truthy(b.Get("rootUnit")) ? b.Str("rootUnit") : null, ["domains"] = Doc.ArrOf(NormHosts(b.Get("domains"))),
            ["isActive"] = !(b.Get("isActive") is JsonValue v && v.TryGetValue<bool>(out var ia) && !ia), ["createdAt"] = TimeUtil.NowIso(), ["createdBy"] = actor,
        };
        _store.Push("tenants", t);
        if (!(b.Get("scaffold") is JsonValue sv && sv.TryGetValue<bool>(out var sc) && !sc)) Scaffold(t, actor);
        if (ownerSub is not null)
        {
            _store.Insert("grants", new JsonObject
            {
                ["tenantId"] = id, ["principalType"] = "user", ["principalId"] = ownerSub, ["resourceType"] = "*", ["scopeType"] = "tenant", ["scopeId"] = null,
                ["permissions"] = Doc.ArrOf(new[] { "manage" }), ["note"] = $"Phụ trách trang {t.Str("name")}", ["expiresAt"] = null, ["createdBy"] = actor, ["createdAt"] = TimeUtil.NowIso(), ["deletedAt"] = null,
            });
        }
        _audit.Log("tenant.create", "tenant", new JsonObject { ["id"] = id, ["title"] = t.Str("name") }, tenant: id);
        return Out(t);
    }

    public JsonObject Update(string id, JsonObject b)
    {
        var t = All().FirstOrDefault(x => x.Str("id") == id) ?? throw HttpError.NotFound("Không tìm thấy trang.");
        var err = Validate(b, t.Str("id")); if (err is not null) throw HttpError.Invalid(err);
        if (b.Get("isActive") is JsonValue v && v.TryGetValue<bool>(out var ia) && !ia && t.Str("id") == DefaultTenant) throw HttpError.Invalid("Không tắt được trang Trường (trang mặc định).");
        if (b.Has("name")) t["name"] = b.Str("name")?.Trim();
        if (b.Has("rootUnit")) t["rootUnit"] = Doc.Truthy(b.Get("rootUnit")) ? b.Str("rootUnit") : null;
        if (b.Has("domains")) t["domains"] = Doc.ArrOf(NormHosts(b.Get("domains")));
        if (b.Has("isActive")) t["isActive"] = Doc.Truthy(b.Get("isActive"));
        t["updatedAt"] = TimeUtil.NowIso(); t["updatedBy"] = _ctx.User!.Sub;
        _store.MarkDirty();
        _audit.Log("tenant.update", "tenant", new JsonObject { ["id"] = t.Str("id"), ["title"] = t.Str("name") }, tenant: t.Str("id"));
        return Out(t);
    }

    /// <summary>Tên miền → mã trang (chỉ trang đang bật) — website dùng để nhận tên miền mới mà không phải build lại.</summary>
    public JsonObject ResolveHost(string? host)
    {
        var h = (host ?? "").Trim().ToLowerInvariant();
        var t = All().FirstOrDefault(x => Active(x) && x.Get("domains").Strings().Contains(h)) ?? throw HttpError.NotFound("Tên miền chưa gắn với trang nào.");
        return new JsonObject { ["id"] = t.Str("id"), ["name"] = t.Str("name") };
    }

    /// <summary>Nội dung mẫu cho trang mới: cấu hình (theo tên trang), trang Giới thiệu/Liên hệ/Chính sách/Điều khoản, menu header/footer/utility.</summary>
    private void Scaffold(JsonObject t, string actor)
    {
        var id = t.Str("id")!; var name = t.Str("name")!;
        var baseS = _store.GetMeta("defaultSettings") is JsonObject d ? (JsonObject)d.DeepClone() : new JsonObject();
        var gen = Doc.Merge(baseS.ObjOrNew("general"), Doc.Obj(("siteName", $"{name} – HUMG"), ("brandName", name.ToUpperInvariant()), ("brandNameEn", ""), ("tagline", "Trường Đại học Mỏ - Địa chất"), ("taglineEn", "Hanoi University of Mining and Geology")));
        var seo = Doc.Merge(baseS.ObjOrNew("seo"), Doc.Obj(("metaTitle", $"{name} | HUMG")));
        baseS["general"] = gen; baseS["seo"] = seo;
        _store.SetSettings(id, baseS);

        JsonObject Stamp() => Doc.Obj(("tenantId", id), ("createdAt", TimeUtil.NowIso()), ("createdBy", actor), ("deletedAt", null));
        JsonObject Page(JsonObject o) => _store.Insert("pages", Doc.Merge(Doc.Obj(("parentId", null), ("template", "default"), ("path", null), ("status", "published"), ("translations", new JsonObject()), ("updatedAt", TimeUtil.NowIso())), Stamp(), o));
        Page(Doc.Obj(("slug", "gioi-thieu"), ("title", $"Giới thiệu {name}"), ("sortOrder", 0), ("bodyHtml", $"<p>Trang giới thiệu {name}. Biên tập nội dung tại CMS → Trang &amp; Menu → Cây trang.</p>")));
        Page(Doc.Obj(("slug", "lien-he"), ("title", "Liên hệ"), ("sortOrder", 1), ("bodyHtml", "<p>Địa chỉ, điện thoại, email của đơn vị. Cập nhật tại CMS → Trang &amp; Menu.</p>")));
        var i0 = 0; foreach (var p in SamplePages.All()) Page(Doc.Merge(p, Doc.Obj(("sortOrder", 10 + i0++))));

        JsonObject En(string label) => Doc.Obj(("en", Doc.Obj(("label", label), ("status", "done"))));
        JsonObject Menu(JsonObject o) => _store.Insert("menuItems", Doc.Merge(Doc.Obj(("groupCode", "header"), ("parentId", null), ("type", "page"), ("icon", null), ("sortOrder", 1), ("isVisible", true), ("openInNewTab", false), ("translations", new JsonObject())), Stamp(), o));
        var intro = Menu(Doc.Obj(("label", "Giới thiệu"), ("url", "/trang/gioi-thieu"), ("icon", "building"), ("sortOrder", 1), ("translations", En("About"))));
        Menu(Doc.Obj(("label", "Giới thiệu chung"), ("url", "/trang/gioi-thieu"), ("parentId", intro.Id()), ("sortOrder", 1), ("translations", En("Overview"))));
        var news = Menu(Doc.Obj(("label", "Tin tức – Sự kiện"), ("url", "/tin-tuc"), ("icon", "newspaper"), ("sortOrder", 2), ("translations", En("News & Events"))));
        Menu(Doc.Obj(("label", "Tin tức"), ("url", "/tin-tuc"), ("parentId", news.Id()), ("sortOrder", 1), ("translations", En("News"))));
        Menu(Doc.Obj(("label", "Sự kiện"), ("url", "/su-kien"), ("parentId", news.Id()), ("sortOrder", 2), ("translations", En("Events"))));
        Menu(Doc.Obj(("label", "Liên hệ"), ("url", "/trang/lien-he"), ("icon", "phone"), ("sortOrder", 3), ("translations", En("Contact"))));
        Menu(Doc.Obj(("label", "Website Trường"), ("url", "https://humg.edu.vn"), ("icon", "globe"), ("sortOrder", 4), ("type", "link"), ("openInNewTab", true), ("translations", En("University website"))));
        var col = Menu(Doc.Obj(("groupCode", "footer"), ("label", name), ("type", "heading"), ("url", null), ("sortOrder", 1)));
        var fl = new[] { ("Giới thiệu", "/trang/gioi-thieu"), ("Tin tức", "/tin-tuc"), ("Liên hệ", "/trang/lien-he") };
        for (var i = 0; i < fl.Length; i++) Menu(Doc.Obj(("groupCode", "footer"), ("parentId", col.Id()), ("label", fl[i].Item1), ("url", fl[i].Item2), ("sortOrder", i + 1)));
        var pol = Menu(Doc.Obj(("groupCode", "footer"), ("label", "Chính sách & Quy định"), ("type", "heading"), ("url", null), ("sortOrder", 2), ("translations", En("Policies"))));
        var pl = new[] { ("Chính sách bảo mật", "/trang/chinh-sach-bao-mat"), ("Điều khoản sử dụng", "/trang/dieu-khoan-su-dung") };
        for (var i = 0; i < pl.Length; i++) Menu(Doc.Obj(("groupCode", "footer"), ("parentId", pol.Id()), ("label", pl[i].Item1), ("url", pl[i].Item2), ("sortOrder", i + 1)));
        Menu(Doc.Obj(("groupCode", "utility"), ("label", "Liên hệ"), ("url", "/trang/lien-he"), ("sortOrder", 1)));
        Menu(Doc.Obj(("groupCode", "utility"), ("label", "Website Trường"), ("url", "https://humg.edu.vn"), ("sortOrder", 2), ("openInNewTab", true), ("type", "link")));
        _store.Insert("categories", Doc.Merge(Doc.Obj(("name", "Tin tức"), ("slug", "tin-tuc"), ("parentId", null), ("description", null), ("sortOrder", 0), ("isActive", true), ("translations", new JsonObject())), Stamp()));

        // khối trang chủ: 1 slide theo tên trang + các khối chép từ trang Trường để biên tập tiếp
        _store.Insert("heroSlides", Doc.Merge(Doc.Obj(("code", $"{id}-hero"), ("kicker", "TRƯỜNG ĐẠI HỌC MỎ - ĐỊA CHẤT"), ("title", name.ToUpperInvariant()), ("subtitle", ""), ("motto", "Tri thức · Bản lĩnh · Sáng tạo · Hội nhập"),
            ("primaryLabel", "Giới thiệu"), ("primaryUrl", "/trang/gioi-thieu"), ("accentLabel", "Tin tức"), ("accentUrl", "/tin-tuc"), ("isVisible", true), ("sortOrder", 0)), Stamp()));
        void Copy(string coll, int n)
        {
            foreach (var r in _store.Rows(coll).Where(r => r.Str("tenantId") == "humg" && !Doc.Truthy(r.Get("deletedAt"))).Take(n).ToList())
            {
                var c = r.Copy(); foreach (var k in new[] { "id", "tenantId", "createdAt", "createdBy" }) c.Remove(k);
                _store.Insert(coll, Doc.Merge(c, Stamp()));
            }
        }
        Copy("quickLinks", 4); Copy("audiences", 6); Copy("strengths", 3); Copy("siteStats", 8);
    }
}
