using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Features.SiteContent;
using HUMG.CMS.Application.Features.Tenants;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>cms-api /api/v1/public/* — website đọc theo tenant, không cần đăng nhập.</summary>
public static class PublicEndpoints
{
    private static string Lang(HttpContext h) => h.Query().Is("lang") ? h.Query()["lang"]! : "vi";

    public static void MapPublic(this RouteGroupBuilder cms)
    {
        var p = cms.MapGroup("/api/v1/public");
        p.MapGet("/site-content", (HttpContext h, PublicSiteService s) => R.Ok(s.SiteContent(Lang(h))));
        p.MapGet("/home", (HttpContext h, PublicSiteService s) => R.Ok(s.Home(Lang(h))));
        p.MapGet("/menus/{code}", (string code, PublicSiteService s) => R.Ok(s.Menu(code)));
        p.MapGet("/banners", (HttpContext h, PublicSiteService s) => R.Ok(s.Banners(h.Query()["position"])));
        p.MapGet("/pages/slug/{slug}", (string slug, HttpContext h, PublicSiteService s) => R.Ok(s.PageBySlug(slug, Lang(h))));
        p.MapGet("/settings", (PublicSiteService s) => R.Ok(s.Settings()));
        p.MapGet("/tenant", (PublicSiteService s) => R.Ok(s.TenantInfo()));
        p.MapGet("/contents", (HttpContext h, PublicSiteService s) => R.Ok(s.Contents(h.Query(), Lang(h))));
        p.MapGet("/contents/slug/{slug}", (string slug, HttpContext h, PublicSiteService s) => R.Ok(s.ContentBySlug(slug, Lang(h))));
        p.MapPost("/contents/{id}/views", (string id, PublicSiteService s) => R.Ok(s.RecordView(id)));
        p.MapGet("/search", (HttpContext h, PublicSiteService s) => R.Ok(s.Search(h.Query())));
        p.MapGet("/media/{id}/url", (string id, PublicSiteService s) => R.Ok(s.MediaUrl(id)));
        p.MapGet("/tenants/resolve", (HttpContext h, TenantService t) => R.Ok(t.ResolveHost(h.Request.Query["host"].FirstOrDefault())));
        cms.MapGet("/api/v1/admin/languages", (PublicSiteService s) => R.Ok(s.Languages()));
        p.MapGet("/languages", (PublicSiteService s) => R.Ok(s.Languages()));
    }
}
