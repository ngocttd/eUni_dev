using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.SiteContent;

/// <summary>Mô tả một tài nguyên cấu hình website (danh mục, sự kiện, album, trang, menu, banner, khối trang chủ…).</summary>
public sealed record ResourceSpec(
    string Name, string Route, string Perm, string[] Fields, Func<JsonObject> Defaults, bool PublicRead = false, string? SlugFrom = null, Func<JsonObject, string?>? Label = null);

public static class ResourceCatalog
{
    private static string Today() => TimeUtil.NowIso()[..10];
    private static JsonObject V(params (string, object?)[] kv) => Doc.Obj(kv);

    public static readonly IReadOnlyList<ResourceSpec> All = new[]
    {
        new ResourceSpec("categories", "categories", "category.manage", new[] { "name", "slug" }, () => V(("parentId", null), ("isActive", true), ("sortOrder", 99), ("description", null), ("translations", new JsonObject())), true, "name"),
        new ResourceSpec("events", "events", "site.manage", new[] { "title", "place" }, () => V(("status", "upcoming"), ("isVisible", true), ("description", new JsonArray()), ("agenda", new JsonArray()), ("contact", null), ("endsAt", null)), false, "title"),
        new ResourceSpec("albums", "albums", "site.manage", new[] { "title" }, () => V(("photos", new JsonArray()), ("isVisible", true), ("publishedAt", Today())), false, "title"),
        new ResourceSpec("videos", "videos", "site.manage", new[] { "title" }, () => V(("viewCount", 0), ("isVisible", true), ("publishedAt", Today())), false, "title"),
        new ResourceSpec("podcasts", "podcasts", "site.manage", new[] { "title" }, () => V(("playCount", 0), ("notes", new JsonArray()), ("isVisible", true), ("publishedAt", Today())), false, "title"),
        new ResourceSpec("pages", "pages", "page.manage", new[] { "title", "slug" }, () => V(("parentId", null), ("template", "default"), ("path", null), ("status", "draft"), ("sortOrder", 99), ("bodyHtml", ""), ("translations", new JsonObject())), false, "title"),
        new ResourceSpec("menuItems", "menu-items", "menu.manage", new[] { "label", "url" }, () => V(("groupCode", "header"), ("parentId", null), ("type", "page"), ("icon", null), ("sortOrder", 99), ("isVisible", true), ("openInNewTab", false), ("translations", new JsonObject())), false, null, r => r.Str("label")),
        new ResourceSpec("banners", "banners", "site.manage", new[] { "title" }, () => V(("isVisible", true), ("sortOrder", 99), ("imageId", null), ("linkUrl", null), ("subtitle", null), ("startsOn", null), ("endsOn", null))),
        new ResourceSpec("heroSlides", "hero-slides", "site.manage", new[] { "title" }, () => V(("isVisible", true), ("sortOrder", 99))),
        new ResourceSpec("quickLinks", "quick-links", "site.manage", new[] { "label" }, () => V(("isVisible", true), ("sortOrder", 99)), false, null, r => r.Str("label")),
        new ResourceSpec("audiences", "audiences", "site.manage", new[] { "title" }, () => V(("isVisible", true), ("sortOrder", 99))),
        new ResourceSpec("strengths", "strengths", "site.manage", new[] { "title" }, () => V(("isVisible", true), ("sortOrder", 99))),
        new ResourceSpec("partners", "partners", "site.manage", new[] { "name", "shortName" }, () => V(("isVisible", true), ("sortOrder", 99), ("website", null))),
        new ResourceSpec("siteStats", "site-stats", "site.manage", new[] { "label", "value" }, () => V(("placement", "hero"), ("isVisible", true), ("sortOrder", 99), ("sub", null)), false, null, r => $"{r.Str("label")}: {r.Str("value")}"),
    };
}

/// <summary>CRUD chung cho các tài nguyên còn lại — theo tenant, xóa mềm, audit diff.</summary>
public sealed class ResourceCrudService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AuditService _audit;
    public ResourceCrudService(IDocumentStore store, RequestContext ctx, AuditService audit) { _store = store; _ctx = ctx; _audit = audit; }

    private List<JsonObject> Trows(ResourceSpec s) => _store.Rows(s.Name).Where(r => r.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(r.Get("deletedAt"))).ToList();
    private static string? LabelOf(ResourceSpec s, JsonObject r) => s.Label is not null ? s.Label(r) : Doc.AsString(r.Get("title") ?? r.Get("name") ?? r.Get("label") ?? r.Get("id"));
    private JsonObject One(ResourceSpec s, string id) =>
        Trows(s).FirstOrDefault(x => x.IdIs(id) || (Doc.Truthy(x.Get("slug")) && x.Str("slug") == id)) ?? throw HttpError.NotFound();

    private static string JsString(JsonNode? n) => n is null ? "null" : Doc.AsString(n) ?? "null";

    public JsonObject List(ResourceSpec s, QueryParams q)
    {
        var l = Trows(s);
        if (q.Is("keyword")) l = l.Where(r => TextUtil.Norm(string.Join(" ", s.Fields.Select(f => Doc.AsString(r.Get(f)) ?? ""))).Contains(TextUtil.Norm(q["keyword"]))).ToList();
        foreach (var (k, v) in q.Items)
        {
            if (k is "keyword" or "pageIndex" or "pageSize" or "lang") continue;
            if (l.Count > 0 && l[0].Has(k)) l = l.Where(r => JsString(r.Get(k)) == v).ToList();
        }
        return Paging.Paged(l, q);
    }

    public JsonObject Trash(ResourceSpec s, QueryParams q) =>
        Paging.Paged(_store.Rows(s.Name).Where(r => r.Str("tenantId") == _ctx.Tenant && Doc.Truthy(r.Get("deletedAt"))).ToList(), q);

    public JsonObject Get(ResourceSpec s, string id) => One(s, id).Copy();

    private static JsonObject Body(JsonObject b) { var o = b.Copy(); o.Remove("id"); o.Remove("tenantId"); return o; }

    public JsonObject Create(ResourceSpec s, JsonObject body)
    {
        var b = Body(body);
        if (s.SlugFrom is not null && !Doc.Truthy(b.Get("slug")) && Doc.Truthy(b.Get(s.SlugFrom))) b["slug"] = TextUtil.Slugify(b.Str(s.SlugFrom));
        var row = _store.Insert(s.Name, Doc.Merge(s.Defaults(), b, Doc.Obj(("tenantId", _ctx.Tenant), ("createdAt", TimeUtil.NowIso()), ("createdBy", _ctx.User!.Sub), ("deletedAt", null))));
        _audit.Log($"{s.Name}.create", s.Name, Doc.Obj(("id", row.Id()), ("title", LabelOf(s, row))));
        return row.Copy();
    }

    public JsonObject Update(ResourceSpec s, string id, JsonObject body)
    {
        var r = One(s, id);
        var b = Body(body);
        var before = r.Copy();
        _store.Update(s.Name, r.Id(), Doc.Merge(b, Doc.Obj(("updatedAt", TimeUtil.NowIso()), ("updatedBy", _ctx.User!.Sub))));
        _audit.Log($"{s.Name}.update", s.Name, Doc.Obj(("id", r.Id()), ("title", LabelOf(s, r))), AuditService.Diff(before, r));
        return r.Copy();
    }

    public void Delete(ResourceSpec s, string id)
    {
        var r = One(s, id);
        _store.Update(s.Name, r.Id(), Doc.Obj(("deletedAt", TimeUtil.NowIso()), ("deletedBy", _ctx.User!.Sub)));
        _audit.Log($"{s.Name}.delete", s.Name, Doc.Obj(("id", r.Id()), ("title", LabelOf(s, r))));
    }

    public JsonObject Restore(ResourceSpec s, string id)
    {
        var r = _store.Rows(s.Name).FirstOrDefault(x => x.Str("tenantId") == _ctx.Tenant && Doc.Truthy(x.Get("deletedAt")) && x.IdIs(id)) ?? throw HttpError.NotFound();
        _store.Update(s.Name, r.Id(), Doc.Obj(("deletedAt", null), ("deletedBy", null)));
        _audit.Log($"{s.Name}.restore", s.Name, Doc.Obj(("id", r.Id()), ("title", LabelOf(s, r))));
        return r.Copy();
    }
}
