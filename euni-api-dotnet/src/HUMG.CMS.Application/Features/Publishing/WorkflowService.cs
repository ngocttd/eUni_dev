using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Domain.Workflow;

namespace HUMG.CMS.Application.Features.Publishing;

/// <summary>
/// Vòng đời dùng chung cho nội dung có workflow — docs/design/CMS_DESIGN.md §7, §8:
/// draft → pending_review → published → archived (+ publishAt hẹn giờ, expireAt); revision (snapshot mỗi lần lưu, khôi phục = phiên bản mới),
/// bản sửa đổi chờ duyệt khi sửa bài đang xuất bản, soft delete (thùng rác), optimistic concurrency (version / If-Match), audit diff, lịch sử workflow.
/// Trạng thái chỉ đổi qua <see cref="Transition"/> (Submit/Approve/Reject/Publish/…); không có PUT tùy ý đổi status.
/// </summary>
public sealed class WorkflowService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AccessService _access;
    private readonly AuditService _audit;

    public WorkflowService(IDocumentStore store, RequestContext ctx, AccessService access, AuditService audit)
    { _store = store; _ctx = ctx; _access = access; _audit = audit; }

    private static string Now() => TimeUtil.NowIso();
    private static long Ts(JsonNode? n) => TimeUtil.Ts(Doc.AsString(n));
    private string UserName(string? sub) => _store.Rows("users").FirstOrDefault(u => u.Str("sub") == sub)?.Str("fullName") ?? sub ?? "";
    private string Sub => _ctx.User!.Sub;

    /// <summary>Bản ghi đang hiển thị công khai: published, đã đến publishAt, chưa quá expireAt, chưa xóa.</summary>
    public static bool IsLive(JsonObject r) =>
        r.Str("status") == WorkflowStatus.Published && !Doc.Truthy(r.Get("deletedAt")) && Ts(r.Get("publishAt")) <= TimeUtil.NowMs()
        && (!Doc.Truthy(r.Get("expireAt")) || Ts(r.Get("expireAt")) > TimeUtil.NowMs());

    public static JsonObject RevisionSnapshot(JsonObject r)
    {
        var o = new JsonObject();
        foreach (var kv in r) if (!WorkflowTransitions.VolatileFields.Contains(kv.Key)) o[kv.Key] = kv.Value?.DeepClone();
        return o;
    }
    private static JsonObject ContentOf(JsonObject? snap)
    {
        var o = new JsonObject();
        if (snap is not null) foreach (var kv in snap) if (!WorkflowTransitions.SystemFields.Contains(kv.Key)) o[kv.Key] = kv.Value?.DeepClone();
        return o;
    }

    private List<JsonObject> Mine(IWorkflowProfile p) => _store.Rows(p.Collection).Where(r => r.Str("tenantId") == _ctx.Tenant).ToList();

    private JsonObject Find(IWorkflowProfile p, string id, bool deleted = false)
    {
        var r = Mine(p).FirstOrDefault(x => x.IdIs(id));
        if (r is null || Doc.Truthy(r.Get("deletedAt")) != deleted) throw HttpError.NotFound(deleted ? "Không có trong thùng rác." : "Không tìm thấy dữ liệu.");
        return r;
    }

    private void Need(IWorkflowProfile p, string action, JsonObject rec)
    {
        if (!_access.Can(p.Type, action, rec)) throw HttpError.Forbidden($"Bạn không có quyền \"{action}\" trên bản ghi này.");
    }

    private JsonObject Out(IWorkflowProfile p, JsonObject r)
    {
        var pending = Doc.Truthy(r.Get("pendingRevisionId")) ? _store.Rows("revisions").FirstOrDefault(v => v.Long("id") == r.Long("pendingRevisionId")) : null;
        var o = Doc.Merge(r, p.Out(r));
        o["isScheduled"] = r.Str("status") == WorkflowStatus.Published && Ts(r.Get("publishAt")) > TimeUtil.NowMs();
        o["isExpired"] = Doc.Truthy(r.Get("expireAt")) && Ts(r.Get("expireAt")) <= TimeUtil.NowMs();
        o["authorName"] = r.Get("authorName") is { } an ? an.DeepClone() : JsonValue.Create(UserName(r.Str("authorSub")));
        o["updatedByName"] = Doc.Truthy(r.Get("updatedBy")) ? UserName(r.Str("updatedBy")) : null;
        o["pendingRevision"] = pending is null ? null : new JsonObject
        {
            ["id"] = pending.Long("id"), ["version"] = pending.Long("version"), ["createdBy"] = pending.Str("createdBy"), ["createdByName"] = UserName(pending.Str("createdBy")), ["createdAt"] = pending.Str("createdAt"),
        };
        o["allowedActions"] = Doc.ArrOf(_access.Allowed(p.Type, r));
        return o;
    }

    private void CheckVersion(JsonObject r, JsonObject? body)
    {
        var raw = _ctx.IfMatch ?? Doc.AsString(body?.Get("version"));
        if (string.IsNullOrEmpty(raw)) return;
        var cleaned = (raw.StartsWith("W/") ? raw[2..] : raw).Replace("\"", "");
        var v = TextUtil.ToNumber(cleaned);
        var cur = r.Long("version") ?? 0;
        if (double.IsNaN(v) || v != cur)
            throw HttpError.Conflict($"Bản ghi đã được người khác cập nhật (phiên bản hiện tại v{cur}, bạn đang sửa v{(double.IsNaN(v) ? "NaN" : v.ToString(System.Globalization.CultureInfo.InvariantCulture))}). Tải lại để xem thay đổi mới nhất.",
                new Dictionary<string, object?> { ["currentVersion"] = cur });
    }

    private List<JsonObject> RevisionsOf(IWorkflowProfile p, JsonObject r) =>
        _store.Rows("revisions").Where(v => v.Str("entityType") == p.Type && v.Long("entityId") == r.Long("id")).ToList();

    private JsonObject SaveRevision(IWorkflowProfile p, JsonObject r, string reason, string state = "current", JsonObject? snap = null)
    {
        snap ??= RevisionSnapshot(r);
        if (state == "current") foreach (var v in RevisionsOf(p, r).Where(v => v.Str("state") == "current")) v["state"] = "superseded";
        var version = state == "current" ? r.Long("version") ?? 1 : Math.Max(0, RevisionsOf(p, r).Select(v => v.Long("version") ?? 0).DefaultIfEmpty(0).Max()) + 1;
        return _store.Insert("revisions", new JsonObject
        {
            ["tenantId"] = _ctx.Tenant, ["entityType"] = p.Type, ["entityId"] = r.Long("id"), ["version"] = version, ["state"] = state, ["snapshot"] = snap, ["reason"] = reason,
            ["createdBy"] = Sub, ["createdAt"] = Now(),
        });
    }

    /// <summary>
    /// Ghi sự kiện outbox trong cùng transaction (docs: "dùng outbox cho công việc cần khởi phát từ giao dịch ghi, như lịch xuất bản").
    /// <c>availableAt</c> = thời điểm xuất bản với bài hẹn giờ → worker chỉ xử lý khi đến hạn.
    /// </summary>
    private void Enqueue(IWorkflowProfile p, JsonObject r, string kind, string? availableAt = null) =>
        _store.Insert("outbox", Doc.Obj(
            ("tenantId", _ctx.Tenant), ("type", $"{(p.Type == "news" ? "News" : "Announcement")}{kind}"),
            ("payload", Doc.Obj(("entityType", p.Type), ("entityId", r.Long("id")), ("tenantId", _ctx.Tenant), ("title", r.Str("title")), ("action", kind), ("publishAt", availableAt ?? r.Str("publishAt")), ("actor", Sub))),
            ("availableAt", availableAt ?? Now()), ("processedAt", null), ("attempts", 0), ("lastError", null)));

    private void History(IWorkflowProfile p, JsonObject r, string action, string? from, string? to, string? note) =>
        _store.Insert("workflowHistory", new JsonObject
        {
            ["tenantId"] = _ctx.Tenant, ["entityType"] = p.Type, ["entityId"] = r.Long("id"), ["action"] = action, ["fromStatus"] = from, ["toStatus"] = to,
            ["note"] = string.IsNullOrEmpty(note) ? null : note, ["actorSub"] = Sub, ["actorName"] = _ctx.User!.Name, ["at"] = Now(),
        });

    /// <summary>Ghi nội dung mới: trực tiếp (version+1) hoặc thành bản sửa đổi chờ duyệt nếu bài đang xuất bản mà user không có quyền publish.</summary>
    private (bool Proposed, JsonObject Revision) ApplyContent(IWorkflowProfile p, JsonObject r, JsonObject patch, string? reason)
    {
        if (r.Str("status") == WorkflowStatus.Archived) throw HttpError.Conflict("Bản ghi đang lưu trữ — xuất bản lại hoặc khôi phục trước khi sửa.");
        var direct = r.Str("status") != WorkflowStatus.Published || _access.Can(p.Type, "publish", r);
        if (!direct)
        {
            Need(p, "edit", r);
            if (Doc.Truthy(r.Get("pendingRevisionId"))) throw HttpError.Conflict("Đã có một bản sửa đổi đang chờ duyệt cho bản ghi này.");
            var rev = SaveRevision(p, r, reason ?? "Đề xuất sửa đổi", "proposed", RevisionSnapshot(Doc.Merge(r, patch)));
            _store.Update(p.Collection, r.Id(), Doc.Obj(("pendingRevisionId", rev.Id())));
            _audit.Log($"{p.Type}.propose", p.Type, r, AuditService.Diff(ContentOf(r), ContentOf(Doc.Merge(r, patch))), Doc.Obj(("revisionVersion", rev.Long("version"))));
            return (true, rev);
        }
        if (r.Str("status") != WorkflowStatus.Draft || r.Str("createdBy") != Sub) Need(p, r.Str("status") == WorkflowStatus.Published ? "publish" : "edit", r);
        if (Doc.Truthy(r.Get("pendingRevisionId"))) throw HttpError.Conflict("Bản ghi có bản sửa đổi chờ duyệt — duyệt hoặc từ chối bản đó trước.");
        var before = ContentOf(r);
        // version mới phải lớn hơn mọi revision đã có (kể cả bản đề xuất bị từ chối) để (entity_type, entity_id, version) luôn duy nhất
        var nextVersion = Math.Max(r.Long("version") ?? 1, RevisionsOf(p, r).Select(v => v.Long("version") ?? 0).DefaultIfEmpty(0).Max()) + 1;
        _store.Update(p.Collection, r.Id(), Doc.Merge(patch, Doc.Obj(("version", nextVersion), ("updatedAt", Now()), ("updatedBy", Sub))));
        var rev2 = SaveRevision(p, r, reason ?? "Cập nhật");
        _audit.Log($"{p.Type}.update", p.Type, r, AuditService.Diff(before, ContentOf(r)), Doc.Obj(("revisionVersion", rev2.Long("version"))));
        if (r.Str("status") == WorkflowStatus.Published) Enqueue(p, r, "Updated");
        return (false, rev2);
    }

    // ---------------------------------------------------------------- truy vấn

    public JsonObject List(IWorkflowProfile p, QueryParams q)
    {
        var st = WorkflowStatus.Parse(q["status"]);
        var list = Mine(p).Where(r => !Doc.Truthy(r.Get("deletedAt")) && _access.Can(p.Type, "view", r)).ToList();
        if (st is not null) list = list.Where(r => r.Str("status") == st).ToList();
        if (q["scheduled"] == "true") list = list.Where(r => r.Str("status") == WorkflowStatus.Published && Ts(r.Get("publishAt")) > TimeUtil.NowMs()).ToList();
        if (q["mine"] == "true") list = list.Where(r => r.Str("createdBy") == Sub).ToList();
        if (q.Is("ownerUnitCode")) list = list.Where(r => r.Str("ownerUnitCode") == q["ownerUnitCode"]).ToList();
        if (q.Is("keyword")) list = list.Where(r => TextUtil.Norm($"{p.Label(r)} {r.Str("authorName")}").Contains(TextUtil.Norm(q["keyword"]))).ToList();
        list = p.Filter(list, q);
        list = list.OrderByDescending(r => Ts(Doc.Truthy(r.Get("updatedAt")) ? r.Get("updatedAt") : r.Get("createdAt"))).ThenByDescending(r => r.Id()).ToList();
        var page = Paging.PagedMap(list, q, r => Out(p, r));
        page["canCreate"] = _access.Can(p.Type, "edit");
        return page;
    }

    public JsonObject Trash(IWorkflowProfile p, QueryParams q)
    {
        var list = Mine(p).Where(r => Doc.Truthy(r.Get("deletedAt")) && (_access.Can(p.Type, "edit", r) || _access.Can(p.Type, "publish", r)))
            .OrderByDescending(r => Ts(r.Get("deletedAt"))).ToList();
        return Paging.PagedMap(list, q, r => { var o = Out(p, r); o["deletedByName"] = UserName(r.Str("deletedBy")); return o; });
    }

    public ServiceResult Get(IWorkflowProfile p, string id)
    {
        var r = Find(p, id); Need(p, "view", r);
        return ServiceResult.Ok(Out(p, r), r.Long("version"));
    }

    // ---------------------------------------------------------------- ghi

    public ServiceResult Create(IWorkflowProfile p, JsonObject b)
    {
        var f = p.Normalize(b, null);
        var draft = Doc.Merge(p.Defaults(), f, Doc.Obj(("tenantId", _ctx.Tenant), ("status", WorkflowStatus.Draft), ("createdBy", Sub)));
        var probe = Doc.Merge(draft); probe["createdBy"] = null;
        if (!_access.Can(p.Type, "edit", probe)) throw HttpError.Forbidden("Bạn không có quyền tạo nội dung trong phạm vi (chuyên mục / đơn vị) này.");
        var now = Now();
        var r = _store.Insert(p.Collection, Doc.Merge(draft, Doc.Obj(("version", 1), ("pendingRevisionId", null), ("submittedAt", null), ("submittedBy", null), ("reviewedAt", null), ("reviewedBy", null), ("reviewNote", null),
            ("firstPublishedAt", null), ("createdAt", now), ("updatedAt", now), ("updatedBy", Sub), ("deletedAt", null), ("deletedBy", null))));
        SaveRevision(p, r, "Tạo mới");
        History(p, r, "create", null, WorkflowStatus.Draft, null);
        _audit.Log($"{p.Type}.create", p.Type, r, null, Doc.Obj(("revisionVersion", 1)));
        // tiện ích: tạo rồi chuyển trạng thái luôn (giữ tương thích FE cũ gửi status khi tạo)
        var want = WorkflowStatus.Parse(b.Str("status"));
        var act = want == WorkflowStatus.PendingReview ? "submit" : want == WorkflowStatus.Published ? "publish" : null;
        if (act is not null) DoTransition(p, r, act, Doc.Obj(("publishAt", b.Get("publishAt"))));
        return new ServiceResult(201, Out(p, r), r.Long("version"));
    }

    public ServiceResult Update(IWorkflowProfile p, string id, JsonObject b)
    {
        var r = Find(p, id);
        CheckVersion(r, b);
        var patch = p.Normalize(b, r);
        var (proposed, _) = ApplyContent(p, r, patch, null);
        var o = Out(p, r);
        if (proposed) o["message"] = "Đã gửi bản sửa đổi chờ duyệt; nội dung đang hiển thị giữ nguyên.";
        return new ServiceResult(proposed ? 202 : 200, o, r.Long("version"));
    }

    public void Delete(IWorkflowProfile p, string id)
    {
        var r = Find(p, id);
        if (!_access.Allowed(p.Type, r).Contains("delete")) throw HttpError.Forbidden("Bạn không có quyền xóa bản ghi này.");
        _store.Update(p.Collection, r.Id(), Doc.Obj(("deletedAt", Now()), ("deletedBy", Sub)));
        _audit.Log($"{p.Type}.delete", p.Type, r);
        if (r.Str("status") == WorkflowStatus.Published) Enqueue(p, r, "Deleted");
    }

    public JsonObject Restore(IWorkflowProfile p, string id)
    {
        var r = Find(p, id, deleted: true);
        if (!_access.Allowed(p.Type, r).Contains("restore")) throw HttpError.Forbidden("Bạn không có quyền khôi phục bản ghi này.");
        _store.Update(p.Collection, r.Id(), Doc.Obj(("deletedAt", null), ("deletedBy", null), ("updatedAt", Now()), ("updatedBy", Sub)));
        _audit.Log($"{p.Type}.restore", p.Type, r);
        return Out(p, r);
    }

    public void Purge(IWorkflowProfile p, string id)
    {
        var r = Find(p, id, deleted: true);
        if (!RoleCatalog_IsSuper()) throw HttpError.Forbidden("Chỉ quản trị hệ thống được xóa vĩnh viễn.");
        _store.Remove(p.Collection, r.Id());
        _audit.Log($"{p.Type}.purge", p.Type, r);
    }
    private bool RoleCatalog_IsSuper() => Domain.AccessControl.RoleCatalog.IsSuper(_ctx.User!.Perms);

    public JsonObject Workflow(IWorkflowProfile p, string id, string action, JsonObject b)
    {
        var r = Find(p, id);
        CheckVersion(r, b);
        DoTransition(p, r, action, b);
        return Out(p, r);
    }

    private void DoTransition(IWorkflowProfile p, JsonObject r, string action, JsonObject b)
    {
        var note = Doc.Truthy(b.Get("note")) ? b.Str("note") : null;
        if (WorkflowTransitions.IsRevisionAction(action))
        {
            Need(p, "review", r);
            var rev = _store.Rows("revisions").FirstOrDefault(v => v.Long("id") == r.Long("pendingRevisionId") && Doc.Truthy(r.Get("pendingRevisionId")))
                ?? throw HttpError.Conflict("Không có bản sửa đổi chờ duyệt.");
            if (action == WorkflowTransitions.RejectRevision)
            {
                if (note is null) throw HttpError.Invalid("Vui lòng nhập lý do từ chối.");
                rev["state"] = "rejected"; rev["reviewNote"] = note;
                _store.Update(p.Collection, r.Id(), Doc.Obj(("pendingRevisionId", null)));
            }
            else
            {
                var before = ContentOf(r);
                foreach (var v in RevisionsOf(p, r).Where(v => v.Str("state") == "current")) v["state"] = "superseded";
                rev["state"] = "current";
                _store.Update(p.Collection, r.Id(), Doc.Merge(ContentOf(rev.Get("snapshot") as JsonObject), Doc.Obj(("version", rev.Long("version")), ("pendingRevisionId", null), ("updatedAt", Now()), ("updatedBy", Sub))));
                _audit.Log($"{p.Type}.update", p.Type, r, AuditService.Diff(before, ContentOf(r)), Doc.Obj(("revisionVersion", rev.Long("version"))));
                if (r.Str("status") == WorkflowStatus.Published) Enqueue(p, r, "Updated");
            }
            _store.MarkDirty();
            History(p, r, action, r.Str("status"), r.Str("status"), note);
            _audit.Log($"{p.Type}.{action}", p.Type, r);
            return;
        }
        if (!WorkflowTransitions.Rules.TryGetValue(action, out var t)) throw HttpError.BadRequest($"Hành động không hợp lệ: {action}.");
        if (!t.From.Contains(r.Str("status") ?? "")) throw HttpError.Conflict($"Không thể \"{t.Label}\" khi bản ghi đang ở trạng thái {r.Str("status")}.");
        Need(p, t.Perm, r);
        if (t.NeedNote && string.IsNullOrWhiteSpace(note)) throw HttpError.Invalid("Vui lòng nhập lý do.");
        if (t.To is WorkflowStatus.Published or WorkflowStatus.PendingReview) { var msg = p.Validate(r); if (msg is not null) throw HttpError.Invalid(msg); }
        var from = r.Str("status");
        var patch = Doc.Obj(("status", t.To), ("updatedAt", Now()), ("updatedBy", Sub));
        if (action == "submit") foreach (var kv in Doc.Obj(("submittedAt", Now()), ("submittedBy", Sub), ("reviewNote", null))) patch[kv.Key] = kv.Value?.DeepClone();
        if (action is "reject" or "approve") foreach (var kv in Doc.Obj(("reviewedAt", Now()), ("reviewedBy", Sub), ("reviewNote", note))) patch[kv.Key] = kv.Value?.DeepClone();
        if (t.To == WorkflowStatus.Published)
        {
            var existingPublish = Doc.Truthy(r.Get("publishAt")) && (action == "approve" || Ts(r.Get("publishAt")) > TimeUtil.NowMs()) ? r.Str("publishAt") : null;
            var at = (Doc.Truthy(b.Get("publishAt")) ? b.Str("publishAt") : null) ?? existingPublish ?? Now();
            if (Doc.Truthy(r.Get("expireAt")) && Ts(r.Get("expireAt")) <= TimeUtil.ParseMs(at).GetValueOrDefault()) throw HttpError.Invalid("Thời gian hết hạn phải sau thời gian xuất bản.");
            patch["publishAt"] = at; patch["firstPublishedAt"] = Doc.Truthy(r.Get("firstPublishedAt")) ? r.Str("firstPublishedAt") : at;
        }
        if (action == "archive") foreach (var kv in p.OnArchive(b)) patch[kv.Key] = kv.Value?.DeepClone();
        _store.Update(p.Collection, r.Id(), patch);
        if (t.To == WorkflowStatus.Published) Enqueue(p, r, "Published", patch.Str("publishAt"));
        else if (from == WorkflowStatus.Published) Enqueue(p, r, action == "archive" ? "Recalled" : "Unpublished");
        History(p, r, action, from, t.To, note);
        _audit.Log($"{p.Type}.{action}", p.Type, r, new JsonObject { ["status"] = new JsonArray(from, t.To) });
    }

    // ---------------------------------------------------------------- revision, lịch sử

    public JsonArray Revisions(IWorkflowProfile p, string id)
    {
        var r = Find(p, id); Need(p, "view", r);
        var list = RevisionsOf(p, r).OrderByDescending(v => v.Long("version")).ThenByDescending(v => v.Id());
        return new JsonArray(list.Select(v =>
        {
            var o = new JsonObject();
            foreach (var kv in v) if (kv.Key != "snapshot") o[kv.Key] = kv.Value?.DeepClone();
            o["createdByName"] = UserName(v.Str("createdBy"));
            o["title"] = (v.Get("snapshot") as JsonObject)?.Get("title")?.DeepClone();
            return (JsonNode?)o;
        }).ToArray());
    }

    private JsonObject FindRevision(IWorkflowProfile p, JsonObject r, string version)
    {
        var n = TextUtil.ToNumber(version);
        return RevisionsOf(p, r).FirstOrDefault(x => !double.IsNaN(n) && x.Long("version") == n) ?? throw HttpError.NotFound("Không có phiên bản này.");
    }

    public JsonObject Revision(IWorkflowProfile p, string id, string version)
    {
        var r = Find(p, id); Need(p, "view", r);
        var v = FindRevision(p, r, version);
        var o = Doc.Merge(v);
        o["createdByName"] = UserName(v.Str("createdBy"));
        o["changesFromCurrent"] = AuditService.Diff(ContentOf(r), ContentOf(v.Get("snapshot") as JsonObject));
        return o;
    }

    public ServiceResult RestoreRevision(IWorkflowProfile p, string id, string version)
    {
        var r = Find(p, id);
        var v = FindRevision(p, r, version);
        var (proposed, _) = ApplyContent(p, r, ContentOf(v.Get("snapshot") as JsonObject), $"Khôi phục từ v{v.Long("version")}");
        return new ServiceResult(proposed ? 202 : 200, Out(p, r));
    }

    public JsonObject HistoryOf(IWorkflowProfile p, string id)
    {
        var r = Find(p, id); Need(p, "view", r);
        var wf = _store.Rows("workflowHistory").Where(h => h.Str("entityType") == p.Type && h.Long("entityId") == r.Long("id")).OrderByDescending(h => Ts(h.Get("at")));
        var audit = _store.Rows("activityLogs").Where(l => l.Str("entityType") == p.Type && l.Str("entityId") == r.Str("id")).OrderByDescending(l => Ts(l.Get("createdAt")));
        return new JsonObject { ["workflow"] = Doc.Arr(wf), ["audit"] = Doc.Arr(audit) };
    }

    /// <summary>Dùng bởi use case khác (vd. thống kê thông báo) để lấy bản ghi trong tenant hiện hành.</summary>
    public JsonObject FindRecord(IWorkflowProfile p, string id) => Find(p, id);
    public JsonObject Present(IWorkflowProfile p, JsonObject r) => Out(p, r);
}
