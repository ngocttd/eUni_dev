using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Features.Announcements;

namespace HUMG.CMS.Api.Endpoints;

public static class AnnouncementEndpoints
{
    public static void MapAnnouncements(this RouteGroupBuilder cms)
    {
        var admin = cms.MapGroup("/api/v1/admin/announcements");
        admin.MapGet("/{id}/stats", (string id, AnnouncementService s) => R.Ok(s.Stats(id))).RequireCms("announcement.view");
        admin.MapGet("/meta/options", () => R.Ok(AnnouncementService.Options())).RequireCms("announcement.view");

        /* Hộp thư của người dùng (portal SV / GV / phụ huynh / lãnh đạo) */
        var me = cms.MapGroup("/api/v1/me/announcements");
        me.MapGet("", (HttpContext h, AnnouncementService s) => R.Ok(s.MyList(h.Query()))).RequireUser();
        me.MapGet("/unread-count", (AnnouncementService s) => R.Ok(s.UnreadCount())).RequireUser();
        me.MapGet("/{id}", (string id, HttpContext h, AnnouncementService s) => R.Ok(s.MyOne(id, h.Query()))).RequireUser();
        me.MapPost("/read-all", (AnnouncementService s) => R.Ok(s.ReadAll())).RequireUser();
        me.MapPost("/{id}/read", (string id, HttpContext h, AnnouncementService s) => R.Ok(s.Mark(id, false, h.Query()))).RequireUser();
        me.MapPost("/{id}/ack", (string id, HttpContext h, AnnouncementService s) => R.Ok(s.Mark(id, true, h.Query()))).RequireUser();
    }
}
