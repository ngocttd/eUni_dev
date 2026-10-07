using System.Text.Json.Nodes;
using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Features.Publishing;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>
/// API vòng đời cho một loại nội dung có workflow: CRUD, thùng rác, chuyển trạng thái, revision, lịch sử.
/// Trạng thái chỉ đổi qua <c>POST …/workflow/{action}</c> — PUT không nhận <c>status</c>.
/// </summary>
public static class WorkflowEndpoints
{
    public static void MapWorkflow<TProfile>(this RouteGroupBuilder cms, string path, string type) where TProfile : class, IWorkflowProfile
    {
        var g = cms.MapGroup($"/api/v1/admin/{path}");
        var view = $"{type}.view";

        g.MapGet("", (HttpContext h, TProfile p, WorkflowService w) => R.Ok(w.List(p, h.Query()))).RequireCms(view);
        g.MapGet("/trash", (HttpContext h, TProfile p, WorkflowService w) => R.Ok(w.Trash(p, h.Query()))).RequireCms(view);
        g.MapGet("/{id}", (string id, TProfile p, WorkflowService w) => R.Of(w.Get(p, id))).RequireCms(view);
        g.MapPost("", async (HttpContext h, TProfile p, WorkflowService w) => R.Of(w.Create(p, await h.BodyAsync()))).RequireCms($"{type}.edit");
        g.MapPut("/{id}", async (string id, HttpContext h, TProfile p, WorkflowService w) => R.Of(w.Update(p, id, await h.BodyAsync()))).RequireCms(view);
        g.MapDelete("/{id}", (string id, TProfile p, WorkflowService w) => { w.Delete(p, id); return R.NoContent(); }).RequireCms(view);
        g.MapPost("/{id}/restore", (string id, TProfile p, WorkflowService w) => R.Ok(w.Restore(p, id))).RequireCms(view);
        g.MapDelete("/{id}/purge", (string id, TProfile p, WorkflowService w) => { w.Purge(p, id); return R.NoContent(); }).RequireCms(view);
        g.MapPost("/{id}/workflow/{action}", async (string id, string action, HttpContext h, TProfile p, WorkflowService w) => R.Ok(w.Workflow(p, id, action, await h.BodyAsync()))).RequireCms(view);
        g.MapGet("/{id}/revisions", (string id, TProfile p, WorkflowService w) => R.Ok(w.Revisions(p, id))).RequireCms(view);
        g.MapGet("/{id}/revisions/{version}", (string id, string version, TProfile p, WorkflowService w) => R.Ok(w.Revision(p, id, version))).RequireCms(view);
        g.MapPost("/{id}/revisions/{version}/restore", (string id, string version, TProfile p, WorkflowService w) => R.Of(w.RestoreRevision(p, id, version))).RequireCms(view);
        g.MapGet("/{id}/history", (string id, TProfile p, WorkflowService w) => R.Ok(w.HistoryOf(p, id))).RequireCms(view);
    }
}
