using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features;

public sealed class DashboardService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AccessService _access;
    public DashboardService(IDocumentStore store, RequestContext ctx, AccessService access) { _store = store; _ctx = ctx; _access = access; }

    private List<JsonObject> Trows(string n) => _store.Rows(n).Where(r => r.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(r.Get("deletedAt"))).ToList();
    private string? CatName(JsonNode? id) => id is null ? null : _store.Rows("categories").FirstOrDefault(c => c.Long("id") == Doc.AsLong(id))?.Str("name");

    public JsonObject Get()
    {
        var contents = Trows("contents").Where(c => _access.Can("news", "view", c)).ToList();
        var anns = Trows("announcements").Where(a => _access.Can("announcement", "view", a)).ToList();
        var total = contents.Count == 0 ? 1 : contents.Count;
        int By(string s) => contents.Count(c => c.Str("status") == s);
        JsonObject Part(string label, int value) => new() { ["label"] = label, ["value"] = value, ["pct"] = Math.Round(value / (double)total * 1000, MidpointRounding.AwayFromZero) / 10 };
        var awaiting = contents.Select(c => (Rec: c, Type: "news")).Concat(anns.Select(a => (Rec: a, Type: "announcement")))
            .Where(x => x.Rec.Str("status") == "pending_review" || Doc.Truthy(x.Rec.Get("pendingRevisionId")))
            .Where(x => _access.Can(x.Type, "review", x.Rec)).ToList();
        JsonNode Latest(JsonObject c) { var o = Doc.Merge(c); o["categoryName"] = CatName(c.Get("categoryId")); return o; }
        return new JsonObject
        {
            ["stats"] = new JsonObject { ["posts"] = contents.Count, ["pages"] = Trows("pages").Count, ["categories"] = Trows("categories").Count, ["announcements"] = anns.Count },
            ["status"] = new JsonObject
            {
                ["total"] = contents.Count,
                ["parts"] = new JsonArray(Part("published", By("published")), Part("draft", By("draft")), Part("pending_review", By("pending_review")), Part("archived", By("archived"))),
            },
            ["awaitingReview"] = new JsonArray(awaiting.Select(x => (JsonNode?)new JsonObject
            {
                ["id"] = x.Rec.Long("id"), ["type"] = x.Type, ["title"] = x.Rec.Get("title")?.DeepClone(), ["status"] = x.Rec.Get("status")?.DeepClone(),
                ["hasPendingRevision"] = Doc.Truthy(x.Rec.Get("pendingRevisionId")), ["updatedAt"] = x.Rec.Get("updatedAt")?.DeepClone(),
            }).ToArray()),
            ["latestPosts"] = new JsonArray(contents.OrderByDescending(c => c.Get("createdAt") is null ? "undefined" : c.Str("createdAt"), StringComparer.Ordinal).Take(3).Select(c => (JsonNode?)Latest(c)).ToArray()),
            ["upcomingEvents"] = new JsonArray(Trows("events").OrderBy(e => e.Str("startsAt") ?? "", StringComparer.Ordinal).Take(3).Select(e => (JsonNode?)e.DeepClone()).ToArray()),
            ["latestMedia"] = new JsonArray(Trows("media").OrderByDescending(m => m.Str("createdAt") ?? "", StringComparer.Ordinal).Take(3).Select(m => (JsonNode?)m.DeepClone()).ToArray()),
            ["trend"] = _store.GetMeta("trend")?.DeepClone(),
            ["onlineUsers"] = 5,
        };
    }
}
