using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Content;

/// <summary>Tin tức (<c>contents</c>) — workflow, revision, thùng rác, ACL theo chuyên mục / đơn vị.</summary>
public sealed class NewsProfile : IWorkflowProfile
{
    private static readonly string[] Fields =
    {
        "title", "excerpt", "metaTitle", "metaDescription", "metaKeywords", "source", "unit", "authorName", "expireAt", "publishAt", "tags", "attachments",
        "featuredImageId", "attachmentId", "translations", "isFeatured", "showOnHome", "ownerUnitCode",
    };

    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly TenantService _tenants;
    public NewsProfile(IDocumentStore store, RequestContext ctx, TenantService tenants) { _store = store; _ctx = ctx; _tenants = tenants; }

    public string Path => "contents";
    public string Collection => "contents";
    public string Type => "news";
    public string Label(JsonObject r) => r.Str("title") ?? "";

    private List<JsonObject> Live(string name) => _store.Rows(name).Where(r => r.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(r.Get("deletedAt"))).ToList();

    public JsonObject Normalize(JsonObject b, JsonObject? existing)
    {
        var f = new JsonObject();
        foreach (var k in Fields) if (b.Has(k)) f[k] = b.Get(k)?.DeepClone();
        // tên trường cũ (v1) vẫn nhận
        if (b.Has("publishedAt") && !b.Has("publishAt")) f["publishAt"] = b.Get("publishedAt")?.DeepClone();
        if (b.Has("expiredAt") && !b.Has("expireAt")) f["expireAt"] = b.Get("expiredAt")?.DeepClone();
        foreach (var k in new[] { "publishAt", "expireAt" }) if (f.Has(k) && f.Str(k) == "") f[k] = null;
        if (f.Has("title") && string.IsNullOrWhiteSpace(Doc.Truthy(f.Get("title")) ? f.Str("title") : null)) throw HttpError.Invalid("Tiêu đề không được để trống.");
        if (existing is null && !Doc.Truthy(b.Get("title"))) throw HttpError.Invalid("Thiếu tiêu đề.");
        if (b.Has("categoryId"))
        {
            var raw = b.Get("categoryId");
            if (raw is null || Doc.Stringify(raw) == "\"\"") f["categoryId"] = null;
            else
            {
                var n = Doc.AsDouble(raw) ?? double.NaN;
                if (double.IsNaN(n) || !Live("categories").Any(c => c.Long("id") == n)) throw HttpError.Invalid("Chuyên mục không thuộc trang này.");
                f["categoryId"] = (long)n;
            }
        }
        if (Doc.Truthy(f.Get("ownerUnitCode")) && !_store.Rows("orgUnits").Any(u => u.Str("code") == f.Str("ownerUnitCode"))) throw HttpError.Invalid("Đơn vị sở hữu không tồn tại.");
        if (b.Has("contentBody")) f["contentBody"] = b.Get("contentBody") is JsonValue v && v.TryGetValue<string>(out var cs) ? cs : Doc.Stringify(b.Get("contentBody"));
        if (b.Has("slug") || (existing is null && Doc.Truthy(b.Get("title"))))
        {
            var slug = TextUtil.Slugify(Doc.Truthy(b.Get("slug")) ? b.Str("slug") : b.Str("title"));
            if (Live("contents").Any(c => c.Str("slug") == slug && c.Long("id") != existing?.Long("id")))
            {
                if (existing is not null) throw HttpError.Conflict("Slug đã tồn tại.");
                slug = $"{slug}-{Base36(TimeUtil.NowMs())}";
            }
            f["slug"] = slug;
        }
        if (Doc.Truthy(f.Get("expireAt")) && Doc.Truthy(f.Get("publishAt")) && TimeUtil.Ts(f.Str("expireAt")) <= TimeUtil.Ts(f.Str("publishAt")))
            throw HttpError.Invalid("Thời gian hết hạn phải sau thời gian xuất bản.");
        return f;
    }

    private static string Base36(long n)
    {
        const string d = "0123456789abcdefghijklmnopqrstuvwxyz";
        if (n == 0) return "0";
        var s = ""; while (n > 0) { s = d[(int)(n % 36)] + s; n /= 36; }
        return s;
    }

    public JsonObject Defaults() => Doc.Obj(
        ("categoryId", null), ("ownerUnitCode", (_ctx.User!.Units.Count > 0 && !string.IsNullOrEmpty(_ctx.User.Units[0]) ? _ctx.User.Units[0] : _tenants.RootUnitOf(_ctx.Tenant))), ("excerpt", null),
        ("isFeatured", false), ("showOnHome", false), ("contentBody", "[]"), ("metaTitle", null), ("metaDescription", null), ("metaKeywords", null), ("featuredImageId", null),
        ("attachmentId", null), ("authorSub", _ctx.User.Sub), ("authorName", _ctx.User.Name), ("source", null), ("unit", null), ("viewCount", 0), ("tags", new JsonArray()),
        ("attachments", new JsonArray()), ("translations", new JsonObject()), ("publishAt", null), ("expireAt", null));

    public string? Validate(JsonObject r) => string.IsNullOrWhiteSpace(r.Str("title")) ? "Bài viết chưa có tiêu đề." : null;
    public JsonObject OnArchive(JsonObject body) => new();

    private string? CatName(JsonNode? id) => id is null ? null : _store.Rows("categories").FirstOrDefault(c => c.Long("id") == Doc.AsLong(id))?.Str("name");
    private string UnitName(string? code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code)?.Str("name") ?? code ?? "";

    public JsonObject Out(JsonObject r) => Doc.Obj(("categoryName", CatName(r.Get("categoryId"))), ("ownerUnitName", UnitName(r.Str("ownerUnitCode"))));

    public List<JsonObject> Filter(List<JsonObject> list, QueryParams q)
    {
        if (q.Is("categoryId")) { var n = TextUtil.ToNumber(q["categoryId"]); list = list.Where(c => c.Long("categoryId") == n).ToList(); }
        if (q.Is("translation")) list = list.Where(c => ((c.Get("translations") as JsonObject)?.Get("en") as JsonObject)?.Str("status") is { Length: > 0 } s ? s == q["translation"] : q["translation"] == "missing").ToList();
        return list;
    }
}
