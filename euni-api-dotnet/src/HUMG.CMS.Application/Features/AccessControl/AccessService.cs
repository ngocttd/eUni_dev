using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.AccessControl;

/// <summary>Cầu nối giữa dữ liệu kho (grants, cây đơn vị) và <see cref="AccessPolicy"/> thuần ở Domain.</summary>
public sealed class AccessService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private AccessPolicy? _policy;

    public AccessService(IDocumentStore store, RequestContext ctx) { _store = store; _ctx = ctx; }

    public AccessPolicy Policy => _policy ??= BuildPolicy();
    public OrgTree Tree => Policy.Tree;

    private AccessPolicy BuildPolicy()
    {
        var parents = _store.Rows("orgUnits").Where(u => u.Str("code") is not null).ToDictionary(u => u.Str("code")!, u => u.Str("parentCode"));
        var tree = new OrgTree(code => parents.TryGetValue(code, out var p) ? p : null);
        var grants = _store.Rows("grants").Select(ToGrant).ToList();
        return new AccessPolicy(grants, tree);
    }

    public static GrantRef ToGrant(JsonObject g)
    {
        long? exp = Doc.Truthy(g.Get("expiresAt")) ? TimeUtil.ParseMs(g.Str("expiresAt")) ?? 0 : null;
        return new GrantRef(g.Str("tenantId") ?? "", g.Str("principalType") ?? "", g.Str("principalId") ?? "", g.Str("resourceType") ?? "*",
            g.Str("scopeType") ?? "", g.Get("scopeId") is null ? null : g.Str("scopeId"),
            g.Get("permissions").Strings().ToList(), exp, Doc.Truthy(g.Get("deletedAt")));
    }

    public static RecordRef Ref(JsonObject r) => new(r.Id(), r.Get("categoryId") is null ? "" : r.Str("categoryId"), r.Str("ownerUnitCode"), r.Str("createdBy"), r.Str("status"),
        Doc.Truthy(r.Get("deletedAt")), Doc.Truthy(r.Get("pendingRevisionId")));

    public bool Can(string type, string action, JsonObject? rec = null) => Policy.Can(_ctx.User, _ctx.Tenant, type, action, rec is null ? null : Ref(rec));
    public bool Can(string type, string action, RecordRef rec) => Policy.Can(_ctx.User, _ctx.Tenant, type, action, rec);
    public bool CanIn(UserPrincipal user, string tenant, string type, string action) => Policy.Can(user, tenant, type, action);
    public List<string> Allowed(string type, JsonObject rec) => Policy.AllowedActions(_ctx.User!, _ctx.Tenant, type, Ref(rec));
    public List<string> TenantsOf(UserPrincipal u) => Policy.TenantsOf(u);
    public List<string> WithAncestors(IEnumerable<string> codes) => Tree.WithAncestors(codes);
}
