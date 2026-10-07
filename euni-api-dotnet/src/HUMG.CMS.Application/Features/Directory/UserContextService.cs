using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features;

/// <summary>Ngữ cảnh người dùng cho CMS: các trang được quản trị, quyền chức năng, đơn vị của tôi, và các nút hiển thị.</summary>
public sealed class UserContextService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly TenantService _tenants;
    private readonly AccessService _access;
    public UserContextService(IDocumentStore store, RequestContext ctx, TenantService tenants, AccessService access) { _store = store; _ctx = ctx; _tenants = tenants; _access = access; }

    public JsonObject Me()
    {
        var t = _ctx.User!;
        var mine = _access.TenantsOf(t);
        var active = _tenants.All().Where(x => _tenants.ActiveById(x.Str("id")) is not null).ToList();
        var list = RoleCatalog.IsSuper(t.Perms) ? active : RoleCatalog.HasPerm(t.Perms.ToList(), "cms.access") ? active.Where(x => mine.Contains(x.Str("id") ?? "")).ToList() : new List<JsonObject>();
        var tenant = list.Any(x => x.Str("id") == _ctx.Tenant) ? _ctx.Tenant : list.FirstOrDefault()?.Str("id");
        JsonObject Can(string type) { var o = new JsonObject(); foreach (var a in AccessPolicy.Actions) o[a] = _access.CanIn(t, tenant ?? "", type, a); return o; }
        var can = new JsonObject { ["news"] = Can("news"), ["announcement"] = Can("announcement") };
        string UnitName(string code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code)?.Str("name") ?? code;
        return new JsonObject
        {
            ["user"] = new JsonObject { ["sub"] = t.Sub, ["name"] = t.Name, ["email"] = t.Email, ["roles"] = Doc.ArrOf(t.Roles), ["units"] = Doc.ArrOf(t.Units) },
            ["permissions"] = Doc.ArrOf(t.Perms),
            ["tenants"] = new JsonArray(list.Select(x => (JsonNode?)new JsonObject
                { ["id"] = x.Str("id"), ["name"] = x.Str("name"), ["rootUnit"] = x.Get("rootUnit")?.DeepClone(), ["domains"] = x.Get("domains") is JsonArray ? x.Get("domains")!.DeepClone() : new JsonArray() }).ToArray()),
            ["currentTenant"] = tenant,
            ["units"] = new JsonArray(_access.WithAncestors(t.Units).Select(c => (JsonNode?)new JsonObject { ["code"] = c, ["name"] = UnitName(c) }).ToArray()),
            ["can"] = can,
        };
    }
}
