using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Audit;

/// <summary>Audit log chỉ ghi thêm (docs/design/CMS_DESIGN.md §8): ai · làm gì · lúc nào · ở đâu · thay đổi gì.</summary>
public sealed class AuditService
{
    private static readonly HashSet<string> Skip = new() { "updatedAt", "updatedBy", "version", "viewCount" };
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    public AuditService(IDocumentStore store, RequestContext ctx) { _store = store; _ctx = ctx; }

    private static JsonNode? Short(JsonNode? v)
    {
        var s = v is JsonValue jv && jv.TryGetValue<string>(out var str) ? str : Doc.Stringify(v);
        return s.Length > 200 ? JsonValue.Create(s[..200] + "…") : v?.DeepClone();
    }

    /// <summary>Diff gọn giữa hai trạng thái bản ghi: <c>{ field: [cũ, mới] }</c> (bỏ trường hệ thống, cắt chuỗi dài).</summary>
    public static JsonObject? Diff(JsonObject? before, JsonObject? after)
    {
        var o = new JsonObject();
        var keys = new List<string>();
        foreach (var k in (before ?? new JsonObject()).Select(x => x.Key).Concat((after ?? new JsonObject()).Select(x => x.Key))) if (!keys.Contains(k)) keys.Add(k);
        foreach (var k in keys)
        {
            if (Skip.Contains(k)) continue;
            var b = before?.Get(k); var a = after?.Get(k);
            if (!Doc.SameJson(b, a)) o[k] = new JsonArray(Short(b), Short(a));
        }
        return o.Count > 0 ? o : null;
    }

    /// <summary>Ghi một dòng audit. <paramref name="entity"/>: bản ghi (JsonObject), nhãn (string) hoặc null.</summary>
    public JsonObject Log(string action, string entityType, object? entity, JsonObject? changes = null, JsonObject? extra = null, string? tenant = null)
    {
        var u = _ctx.User;
        string? label; string? entityId = null;
        if (entity is JsonObject e)
        {
            label = Doc.AsString(e.Get("title") ?? e.Get("name") ?? e.Get("label") ?? e.Get("fileName") ?? e.Get("id"));
            entityId = Doc.AsString(e.Get("id")) ?? "";
        }
        else label = entity?.ToString();
        var row = new JsonObject
        {
            ["tenantId"] = tenant ?? _ctx.Tenant, ["actorSub"] = u?.Sub, ["userName"] = u?.Name ?? "Hệ thống", ["action"] = action, ["entityType"] = entityType,
            ["entityId"] = entityId, ["targetLabel"] = label ?? "", ["changes"] = changes?.DeepClone(), ["ipAddress"] = _ctx.Ip?.Replace("::ffff:", ""),
            ["userAgent"] = _ctx.UserAgent, ["createdAt"] = TimeUtil.NowIso(),
        };
        if (extra is not null) foreach (var kv in extra) row[kv.Key] = kv.Value?.DeepClone();
        return _store.Insert("activityLogs", row);
    }

    /// <summary>GET audit-logs / activity-logs.</summary>
    public JsonObject List(QueryParams q)
    {
        var l = _store.Rows("activityLogs").Where(x => x.Str("tenantId") == _ctx.Tenant).OrderByDescending(x => x.Str("createdAt") ?? "", StringComparer.Ordinal).ToList();
        if (q.Is("action")) l = l.Where(x => x.Str("action") == q["action"]).ToList();
        if (q.Is("actor")) l = l.Where(x => x.Str("actorSub") == q["actor"]).ToList();
        if (q.Is("entityType")) l = l.Where(x => x.Str("entityType") == q["entityType"]).ToList();
        if (q.Is("entityId")) l = l.Where(x => x.Str("entityId") == q["entityId"]).ToList();
        if (q.Is("from")) l = l.Where(x => string.CompareOrdinal(x.Str("createdAt") ?? "", q["from"]) >= 0).ToList();
        if (q.Is("to")) l = l.Where(x => string.CompareOrdinal(x.Str("createdAt") ?? "", q["to"]) <= 0).ToList();
        if (q.Is("keyword")) l = l.Where(x => TextUtil.Norm($"{x.Str("userName")} {x.Str("targetLabel")}").Contains(TextUtil.Norm(q["keyword"]))).ToList();
        return Paging.Paged(l, q);
    }
}
