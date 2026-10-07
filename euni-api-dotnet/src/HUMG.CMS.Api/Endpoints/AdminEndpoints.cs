using System.Text;
using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Features;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Application.Features.Backups;
using HUMG.CMS.Application.Features.Media;
using HUMG.CMS.Application.Features.Settings;
using HUMG.CMS.Application.Features.SiteContent;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>Quản trị: ngữ cảnh, danh bạ, grants, trang đơn vị, media, cấu hình, audit, sao lưu, dashboard.</summary>
public static class AdminEndpoints
{
    public static void MapAdmin(this RouteGroupBuilder cms)
    {
        /* ngữ cảnh người dùng */
        cms.MapGet("/api/v1/me/context", (UserContextService s) => R.Ok(s.Me())).RequireUser();

        /* danh bạ (IdS, chỉ đọc) + cây đơn vị */
        cms.MapGet("/api/v1/admin/org-units", (DirectoryService d) => R.Ok(d.OrgUnits())).RequireCms();
        cms.MapGet("/api/v1/admin/directory/users", (HttpContext h, DirectoryService d) => R.Ok(d.Users(h.Query()))).RequireCms();
        cms.MapGet("/api/v1/admin/directory/users/{sub}", (string sub, DirectoryService d) => R.Ok(d.User(sub))).RequireCms();
        cms.MapGet("/api/v1/admin/directory/roles", (DirectoryService d) => R.Ok(d.Roles())).RequireCms();

        /* phân quyền mức bản ghi */
        var gr = cms.MapGroup("/api/v1/admin/grants");
        gr.MapGet("", (HttpContext h, GrantService s) => R.Ok(s.List(h.Query()))).RequireCms("grant.manage");
        gr.MapGet("/effective/{sub}", (string sub, GrantService s) => R.Ok(s.Effective(sub))).RequireCms("grant.manage");
        gr.MapPost("", async (HttpContext h, GrantService s) => R.Status(201, s.Create(await h.BodyAsync()))).RequireCms("grant.manage");
        gr.MapPut("/{id}", async (string id, HttpContext h, GrantService s) => R.Ok(s.Update(id, await h.BodyAsync()))).RequireCms("grant.manage");
        gr.MapDelete("/{id}", (string id, GrantService s) => { s.Delete(id); return R.NoContent(); }).RequireCms("grant.manage");

        /* trang đơn vị (tenant) — chỉ cms.admin */
        var tn = cms.MapGroup("/api/v1/admin/tenants");
        tn.MapGet("", (TenantService s) => R.Ok(s.List())).RequireSuper();
        tn.MapPost("", async (HttpContext h, TenantService s) => R.Status(201, s.Create(await h.BodyAsync()))).RequireSuper();
        tn.MapPut("/{id}", async (string id, HttpContext h, TenantService s) => R.Ok(s.Update(id, await h.BodyAsync()))).RequireSuper();

        cms.MapGet("/api/v1/admin/menu-groups", (IDocumentStore store) => R.Ok(store.GetMeta("menuGroups")?.DeepClone())).RequireCms("menu.manage");

        /* media: metadata ở kho, file ở IFileStorage */
        var md = cms.MapGroup("/api/v1/admin/media");
        md.MapGet("", (HttpContext h, MediaService s) => R.Ok(s.List(h.Query()))).RequireCms("media.manage");
        md.MapGet("/{id}", (string id, MediaService s) => R.Ok(s.Get(id))).RequireCms("media.manage");
        md.MapPost("/upload", async (HttpContext h, MediaService s) =>
        {
            var form = await h.Request.ReadFormAsync();
            var file = form.Files.GetFile("file") ?? form.Files.FirstOrDefault(f => f.Name == "file");
            if (file is null) throw HttpError.Invalid("Thiếu file.");
            await using var stream = file.OpenReadStream();
            return R.Status(201, await s.UploadAsync(new UploadRequest(stream, file.FileName, file.ContentType, form["altText"].FirstOrDefault(), form["caption"].FirstOrDefault(), form["folder"].FirstOrDefault()), h.RequestAborted));
        }).RequireCms("media.manage").DisableAntiforgery();
        md.MapDelete("/{id}", (string id, MediaService s) => { s.Delete(id); return R.NoContent(); }).RequireCms("media.manage");

        /* cấu hình theo tenant */
        var st = cms.MapGroup("/api/v1/admin/settings");
        st.MapGet("", (SettingsService s) => R.Ok(s.All())).RequireCms("settings.manage");
        st.MapPost("/email/test", async (HttpContext h, SettingsService s) => R.Ok(s.TestEmail(await h.BodyAsync()))).RequireCms("settings.manage");
        st.MapGet("/{group}", (string group, SettingsService s) => R.Ok(s.Group(group))).RequireCms("settings.manage");
        st.MapPut("/{group}", async (string group, HttpContext h, SettingsService s) => R.Ok(s.Update(group, await h.BodyAsync()))).RequireCms("settings.manage");

        /* audit log (chỉ ghi thêm); activity-logs giữ làm tên cũ */
        cms.MapGet("/api/v1/admin/audit-logs", (HttpContext h, AuditService s) => R.Ok(s.List(h.Query()))).RequireCms("log.view");
        cms.MapGet("/api/v1/admin/activity-logs", (HttpContext h, AuditService s) => R.Ok(s.List(h.Query()))).RequireCms("log.view");

        /* sao lưu — chỉ quản trị hệ thống */
        var bk = cms.MapGroup("/api/v1/admin/backups");
        bk.MapGet("", (HttpContext h, BackupService s) => R.Ok(s.List(h.Query()))).RequireCms("backup.manage");
        bk.MapPost("", (BackupService s) => R.Status(201, s.Create())).RequireCms("backup.manage");
        bk.MapGet("/{id}/download", (string id, HttpContext h, BackupService s) =>
        {
            var (json, name) = s.Download(id);
            h.Response.Headers.ContentDisposition = $"attachment; filename=\"{name}\"";
            return Results.Text(json, "application/json; charset=utf-8", Encoding.UTF8);
        }).RequireCms("backup.manage");
        bk.MapPost("/restore", async (HttpContext h, BackupService s) =>
        {
            var form = await h.Request.ReadFormAsync();
            var file = form.Files.GetFile("file");
            string? json = null;
            if (file is not null) { using var sr = new StreamReader(file.OpenReadStream(), Encoding.UTF8); json = await sr.ReadToEndAsync(); }
            s.RestoreFromFile(json);
            return R.Ok(new System.Text.Json.Nodes.JsonObject { ["ok"] = true });
        }).RequireCms("backup.manage").DisableAntiforgery();
        bk.MapPost("/{id}/restore", (string id, BackupService s) => { s.RestoreFromSnapshot(id); return R.Ok(new System.Text.Json.Nodes.JsonObject { ["ok"] = true }); }).RequireCms("backup.manage");
        bk.MapDelete("/{id}", (string id, BackupService s) => { s.Delete(id); return R.NoContent(); }).RequireCms("backup.manage");

        cms.MapGet("/api/v1/admin/dashboard", (DashboardService s) => R.Ok(s.Get())).RequireCms();
    }
}
