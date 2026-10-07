using System.Text.RegularExpressions;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.SiteContent;

/// <summary>
/// Phần công khai của cms-api (<c>/api/v1/public/*</c>): website đọc theo tenant, không cần đăng nhập.
/// Ghi ở CMS → các endpoint này đổi ngay (bản ghi đang hiển thị = published, đến publishAt, chưa quá expireAt, chưa xóa).
/// </summary>
public sealed class PublicSiteService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly TenantService _tenants;
    public PublicSiteService(IDocumentStore store, RequestContext ctx, TenantService tenants) { _store = store; _ctx = ctx; _tenants = tenants; }

    private string Tenant => _ctx.Tenant;
    private List<JsonObject> Trows(string name) => _store.Rows(name).Where(r => r.Str("tenantId") == Tenant && !Doc.Truthy(r.Get("deletedAt"))).ToList();
    private static bool Visible(JsonObject x) => !(x.Get("isVisible") is JsonValue v && v.TryGetValue<bool>(out var b) && !b);
    private static List<JsonObject> BySort(IEnumerable<JsonObject> l) => l.OrderBy(x => x.Long("sortOrder") ?? 0).ToList();
    private static List<JsonObject> ByDate(IEnumerable<JsonObject> l) => l.OrderByDescending(x => x.Get("publishedAt") is null ? "null" : x.Str("publishedAt"), StringComparer.Ordinal).ToList();
    private static JsonArray Arr(IEnumerable<JsonObject> l) => new(l.Select(x => (JsonNode?)x.DeepClone()).ToArray());

    public JsonObject SettingsOf(string tenant)
    {
        var s = _store.GetSettings(tenant);
        if (s is null)
        {
            // tenant chưa có cấu hình riêng: dùng bản sao cấu hình mặc định (RLS không cho đọc cấu hình của tenant khác)
            s = _store.GetMeta("defaultSettings") is JsonObject d ? (JsonObject)d.DeepClone() : new JsonObject();
            _store.SetSettings(tenant, s);
        }
        return s;
    }

    private string? CatName(JsonNode? id) => id is null ? null : _store.Rows("categories").FirstOrDefault(c => c.Long("id") == Doc.AsLong(id))?.Str("name");

    /// <summary>Chỉ các bản dịch ĐÃ HOÀN TẤT (status done) mới được công khai; bản đang dịch/chưa dịch → website dùng lại tiếng Việt.</summary>
    private static JsonObject DoneTranslations(JsonObject c, bool withBody)
    {
        var o = new JsonObject();
        if (c.Get("translations") is not JsonObject tr) return o;
        foreach (var kv in tr)
        {
            if (kv.Value is not JsonObject t || t.Str("status") != "done" || !Doc.Truthy(t.Get("title"))) continue;
            var x = new JsonObject { ["title"] = t.Str("title"), ["excerpt"] = t.Get("excerpt")?.DeepClone() };
            if (withBody) x["contentBody"] = t.Get("contentBody")?.DeepClone();
            o[kv.Key] = x;
        }
        return o;
    }

    private static void Copy(JsonObject to, string key, JsonObject from, string? fromKey = null)
    {
        fromKey ??= key;
        if (from.Has(fromKey)) to[key] = from.Get(fromKey)?.DeepClone();
    }

    /// <summary>Bản hiển thị công khai của bài viết — lang=en: dùng bản dịch đã hoàn tất, thiếu thì quay về tiếng Việt.</summary>
    public JsonObject PublicArticle(JsonObject c, string lang = "vi", bool withBody = true)
    {
        var tr = lang != "vi" ? (c.Get("translations") as JsonObject)?.Get(lang) as JsonObject : null;
        var ok = tr is not null && tr.Str("status") == "done" && Doc.Truthy(tr.Get("title"));
        JsonNode? Pick(string key) => ok && Doc.Truthy(tr!.Get(key)) ? tr.Get(key) : c.Get(key);
        var o = new JsonObject();
        Copy(o, "id", c); Copy(o, "slug", c); Copy(o, "categoryId", c);
        o["categoryName"] = CatName(c.Get("categoryId"));
        Copy(o, "unit", c); Copy(o, "tags", c); Copy(o, "authorName", c);
        o["title"] = (ok ? tr!.Get("title") : c.Get("title"))?.DeepClone();
        o["excerpt"] = Pick("excerpt")?.DeepClone();
        o["metaTitle"] = (ok ? (tr!.Get("metaTitle") ?? c.Get("metaTitle")) : c.Get("metaTitle"))?.DeepClone();
        o["metaDescription"] = (ok ? (tr!.Get("metaDescription") ?? c.Get("metaDescription")) : c.Get("metaDescription"))?.DeepClone();
        Copy(o, "isFeatured", c); Copy(o, "showOnHome", c); Copy(o, "viewCount", c); Copy(o, "publishedAt", c, "publishAt"); Copy(o, "attachments", c);
        o["language"] = ok ? lang : "vi";
        o["translations"] = DoneTranslations(c, withBody);
        if (withBody) o["contentBody"] = Pick("contentBody")?.DeepClone();
        return o;
    }

    private List<JsonObject> LiveContents() => Trows("contents").Where(WorkflowService.IsLive).OrderByDescending(c => TimeUtil.Ts(c.Str("publishAt"))).ToList();
    private List<JsonObject> EventsByStart(IEnumerable<JsonObject> l) => l.OrderBy(e => e.Str("startsAt") ?? "", StringComparer.Ordinal).ToList();

    // ------------------------------------------------------------ endpoints

    public JsonObject SiteContent(string lang) => new()
    {
        ["categories"] = new JsonArray(BySort(Trows("categories")).Where(c => Doc.Truthy(c.Get("isActive"))).Select(c => (JsonNode?)new JsonObject
            { ["id"] = c.Long("id"), ["parentId"] = c.Get("parentId")?.DeepClone(), ["name"] = c.Str("name"), ["slug"] = c.Str("slug") }).ToArray()),
        ["articles"] = new JsonArray(LiveContents().Select(c => (JsonNode?)PublicArticle(c, lang)).ToArray()),
        ["events"] = Arr(EventsByStart(Trows("events").Where(Visible))),
        ["albums"] = Arr(ByDate(Trows("albums").Where(Visible))),
        ["videos"] = Arr(ByDate(Trows("videos").Where(Visible))),
        ["podcasts"] = Arr(ByDate(Trows("podcasts").Where(Visible))),
        ["searchPages"] = _store.GetMeta("searchPages")?.DeepClone(),
    };

    public JsonObject Home(string lang)
    {
        var live = LiveContents();
        var homeItems = live.Where(c => Doc.Truthy(c.Get("showOnHome"))).ToList();
        var featured = homeItems.FirstOrDefault(c => Doc.Truthy(c.Get("isFeatured"))) ?? homeItems.FirstOrDefault() ?? live.FirstOrDefault();
        var stats = Trows("siteStats").Where(Visible).ToList();
        var hero = SettingsOf(Tenant).Get("home") is JsonObject h ? h.Get("heroChips") : null;
        JsonArray Media(string n) => new(ByDate(Trows(n).Where(Visible)).Take(3).Select(x => (JsonNode?)x.DeepClone()).ToArray());
        return new JsonObject
        {
            ["heroSlides"] = Arr(BySort(Trows("heroSlides").Where(Visible))), ["quickLinks"] = Arr(BySort(Trows("quickLinks").Where(Visible))),
            ["audiences"] = Arr(BySort(Trows("audiences").Where(Visible))), ["strengths"] = Arr(BySort(Trows("strengths").Where(Visible))),
            ["partners"] = Arr(BySort(Trows("partners").Where(Visible))),
            ["heroStats"] = Arr(BySort(stats.Where(s => s.Str("placement") == "hero"))), ["universityStats"] = Arr(BySort(stats.Where(s => s.Str("placement") == "about"))),
            ["heroChips"] = hero?.DeepClone() ?? new JsonArray(),
            ["featuredNews"] = featured is null ? null : PublicArticle(featured, lang, false),
            ["newsList"] = new JsonArray(homeItems.Where(c => !ReferenceEquals(c, featured)).Take(3).Select(c => (JsonNode?)PublicArticle(c, lang, false)).ToArray()),
            ["upcomingEvents"] = Arr(EventsByStart(Trows("events").Where(Visible)).Take(5)),
            ["mediaTabs"] = new JsonObject { ["albums"] = Media("albums"), ["videos"] = Media("videos"), ["podcasts"] = Media("podcasts") },
        };
    }

    public JsonArray Menu(string code) => Arr(BySort(Trows("menuItems").Where(m => m.Str("groupCode") == code && Doc.Truthy(m.Get("isVisible")))));

    public JsonArray Banners(string? position)
    {
        var today = TimeUtil.NowIso()[..10];
        string? MediaUrl(JsonNode? id) => Doc.Truthy(id) ? Trows("media").FirstOrDefault(m => m.Long("id") == Doc.AsLong(id))?.Str("url") : null;
        var list = BySort(Trows("banners").Where(b => Doc.Truthy(b.Get("isVisible")) && (string.IsNullOrEmpty(position) || b.Str("position") == position)
            && (!Doc.Truthy(b.Get("startsOn")) || string.CompareOrdinal(b.Str("startsOn"), today) <= 0) && (!Doc.Truthy(b.Get("endsOn")) || string.CompareOrdinal(b.Str("endsOn"), today) >= 0)));
        return new JsonArray(list.Select(b =>
        {
            var o = new JsonObject { ["id"] = b.Long("id"), ["position"] = b.Str("position"), ["title"] = b.Str("title") };
            o["subtitle"] = Doc.Truthy(b.Get("subtitle")) ? b.Str("subtitle") : null;
            Copy(o, "linkUrl", b); o["imageUrl"] = MediaUrl(b.Get("imageId")); Copy(o, "sortOrder", b); Copy(o, "startsOn", b); Copy(o, "endsOn", b);
            return (JsonNode?)o;
        }).ToArray());
    }

    /// <summary>Trang tĩnh soạn ở CMS (template khác "system"), đã xuất bản. Website hiển thị ở /trang/{slug}.</summary>
    public JsonObject PageBySlug(string slug, string lang)
    {
        var all = Trows("pages");
        var pg = all.FirstOrDefault(x => x.Str("slug") == slug && x.Str("status") == "published" && x.Str("template") != "system") ?? throw HttpError.NotFound("Không tìm thấy trang.");
        var tr = lang != "vi" ? (pg.Get("translations") as JsonObject)?.Get(lang) as JsonObject : null;
        var ok = tr is not null && tr.Str("status") == "done" && Doc.Truthy(tr.Get("title"));
        var parents = new List<JsonNode?>();
        var p = all.FirstOrDefault(x => x.Long("id") == pg.Long("parentId") && Doc.Truthy(pg.Get("parentId")));
        for (var g = 0; p is not null && g < 10; g++)
        {
            parents.Insert(0, new JsonObject { ["title"] = p.Str("title"), ["url"] = p.Str("template") == "system" ? p.Str("path") : $"/trang/{p.Str("slug")}" });
            var pid = p.Get("parentId"); p = Doc.Truthy(pid) ? all.FirstOrDefault(x => x.Long("id") == Doc.AsLong(pid)) : null;
        }
        return new JsonObject
        {
            ["id"] = pg.Long("id"), ["slug"] = pg.Str("slug"), ["title"] = ok ? tr!.Str("title") : pg.Str("title"),
            ["bodyHtml"] = ok && Doc.Truthy(tr!.Get("bodyHtml")) ? tr.Str("bodyHtml") : (Doc.Truthy(pg.Get("bodyHtml")) ? pg.Str("bodyHtml") : ""),
            ["language"] = ok ? lang : "vi", ["template"] = pg.Str("template"), ["parents"] = new JsonArray(parents.ToArray()),
            ["updatedAt"] = (Doc.Truthy(pg.Get("updatedAt")) ? pg.Get("updatedAt") : Doc.Truthy(pg.Get("createdAt")) ? pg.Get("createdAt") : null)?.DeepClone(),
        };
    }

    public JsonObject Settings()
    {
        var s = SettingsOf(Tenant);
        return new JsonObject { ["tenant"] = Tenant, ["general"] = s.Get("general")?.DeepClone(), ["seo"] = s.Get("seo")?.DeepClone(), ["language"] = s.Get("language")?.DeepClone() };
    }

    public JsonObject TenantInfo()
    {
        var t = _tenants.ActiveById(Tenant) ?? throw HttpError.NotFound();
        return new JsonObject { ["id"] = t.Str("id"), ["name"] = t.Str("name"), ["rootUnit"] = t.Get("rootUnit")?.DeepClone() };
    }

    public JsonObject Contents(QueryParams q, string lang)
    {
        var list = LiveContents();
        if (q.Is("categoryId")) { var n = TextUtil.ToNumber(q["categoryId"]); list = list.Where(c => c.Long("categoryId") == n).ToList(); }
        if (q.Is("keyword")) list = list.Where(c => TextUtil.Norm($"{c.Str("title")} {c.Str("excerpt")}").Contains(TextUtil.Norm(q["keyword"]))).ToList();
        return Paging.PagedMap(list, q, c => PublicArticle(c, lang, false));
    }

    public JsonObject ContentBySlug(string slug, string lang)
    {
        var c = LiveContents().FirstOrDefault(x => x.Str("slug") == slug) ?? throw HttpError.NotFound("Không tìm thấy bài viết.");
        return PublicArticle(c, lang);
    }

    /// <summary>Ghi nhận lượt xem bài viết công khai.</summary>
    public JsonObject RecordView(string id)
    {
        var c = LiveContents().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound("Không tìm thấy bài viết.");
        _store.Update("contents", c.Id(), Doc.Obj(("viewCount", (c.Long("viewCount") ?? 0) + 1)));
        return new JsonObject { ["id"] = c.Long("id"), ["viewCount"] = c.Long("viewCount") };
    }

    private static string StripTags(string? html) => Regex.Replace(html ?? "", "<[^>]+>", " ");

    /// <summary>Tìm kiếm không dấu (backend thật: unaccent + pg_trgm, xem database/v2/schema.sql).</summary>
    public JsonObject Search(QueryParams q)
    {
        var term = TextUtil.Norm(q["q"]);
        bool Hit(params string?[] f) => term.Length == 0 || f.Any(x => TextUtil.Norm(x).Contains(term));
        var o = new List<JsonObject>();
        foreach (var a in LiveContents()) if (Hit(a.Str("title"), a.Str("excerpt"), a.Str("contentBody")))
            o.Add(Doc.Obj(("type", "Bài viết"), ("title", a.Str("title")), ("excerpt", a.Get("excerpt")), ("publishedAt", a.Get("publishAt")), ("category", CatName(a.Get("categoryId"))), ("to", $"/tin-tuc/{a.Str("slug")}")));
        foreach (var e in Trows("events")) if (Hit(e.Str("title")))
            o.Add(Doc.Obj(("type", "Sự kiện"), ("title", e.Str("title")), ("excerpt", e.Get("place")), ("publishedAt", e.Get("startsAt")), ("to", $"/su-kien/{e.Str("slug")}")));
        foreach (var v in Trows("videos")) if (Hit(v.Str("title"), v.Str("description")))
            o.Add(Doc.Obj(("type", "Media"), ("title", v.Str("title")), ("excerpt", v.Get("description")), ("publishedAt", v.Get("publishedAt")), ("to", $"/media/video/{v.Str("slug")}")));
        foreach (var p in Trows("podcasts")) if (Hit(p.Str("title"), p.Str("description")))
            o.Add(Doc.Obj(("type", "Media"), ("title", p.Str("title")), ("excerpt", p.Get("description")), ("publishedAt", p.Get("publishedAt")), ("to", $"/media/podcast/{p.Str("slug")}")));
        foreach (var a in Trows("albums")) if (Hit(a.Str("title")))
            o.Add(Doc.Obj(("type", "Media"), ("title", a.Str("title")), ("excerpt", $"Album ảnh · {(a.Get("photos") as JsonArray)?.Count ?? 0} ảnh"), ("publishedAt", a.Get("publishedAt")), ("to", $"/media/anh/{a.Str("slug")}")));
        foreach (var p in (_store.GetMeta("searchPages") as JsonArray).Objects()) if (Hit(p.Str("title"), p.Str("excerpt"))) o.Add(p.Copy());
        foreach (var p in Trows("pages").Where(x => x.Str("status") == "published" && x.Str("template") != "system")) if (Hit(p.Str("title"), StripTags(p.Str("bodyHtml"))))
            o.Add(Doc.Obj(("type", "Trang"), ("title", p.Str("title")), ("excerpt", Regex.Replace(StripTags(p.Str("bodyHtml")), @"\s+", " ").Trim() is { } s ? (s.Length > 160 ? s[..160] : s) : ""), ("to", $"/trang/{p.Str("slug")}")));
        return Paging.Paged(o, q);
    }

    public JsonObject MediaUrl(string id)
    {
        var m = Trows("media").FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound();
        return new JsonObject { ["url"] = m.Get("url")?.DeepClone() };
    }

    public JsonArray Languages() => Arr(_store.Rows("languages"));
}
