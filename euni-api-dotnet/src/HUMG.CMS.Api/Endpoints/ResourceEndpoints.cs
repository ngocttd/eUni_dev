using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Features.SiteContent;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>CRUD chung cho tài nguyên cấu hình website (danh mục, sự kiện, album, trang, menu, banner, khối trang chủ…).</summary>
public static class ResourceEndpoints
{
    public static void MapResources(this RouteGroupBuilder cms)
    {
        foreach (var spec in ResourceCatalog.All)
        {
            var s = spec;
            if (s.PublicRead) cms.MapGet($"/api/v1/public/{s.Route}", (HttpContext h, ResourceCrudService c) => R.Ok(c.List(s, h.Query())));
            var g = cms.MapGroup($"/api/v1/admin/{s.Route}");
            var perm = s.PublicRead ? null : s.Perm; // đọc danh mục: chỉ cần vào được CMS
            g.MapGet("", (HttpContext h, ResourceCrudService c) => R.Ok(c.List(s, h.Query()))).RequireCms(perm);
            g.MapGet("/trash", (HttpContext h, ResourceCrudService c) => R.Ok(c.Trash(s, h.Query()))).RequireCms(s.Perm);
            g.MapGet("/{id}", (string id, ResourceCrudService c) => R.Ok(c.Get(s, id))).RequireCms(s.Perm);
            g.MapPost("", async (HttpContext h, ResourceCrudService c) => R.Status(201, c.Create(s, await h.BodyAsync()))).RequireCms(s.Perm);
            g.MapPut("/{id}", async (string id, HttpContext h, ResourceCrudService c) => R.Ok(c.Update(s, id, await h.BodyAsync()))).RequireCms(s.Perm);
            g.MapDelete("/{id}", (string id, ResourceCrudService c) => { c.Delete(s, id); return R.NoContent(); }).RequireCms(s.Perm);
            g.MapPost("/{id}/restore", (string id, ResourceCrudService c) => R.Ok(c.Restore(s, id))).RequireCms(s.Perm);
        }
    }
}
