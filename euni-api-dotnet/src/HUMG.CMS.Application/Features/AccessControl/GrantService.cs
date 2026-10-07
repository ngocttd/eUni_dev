using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.AccessControl;

/// <summary>
/// Phân quyền mức bản ghi (grants) — thay các màn user/role cũ (user, role quản lý ở Identity Server).
/// Phạm vi: toàn trang · chuyên mục · đơn vị (gồm đơn vị con) · một bản ghi.
/// </summary>
public sealed class GrantService
{
    private static readonly string[] GrantPerms = { "view", "edit", "review", "publish", "manage" };
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly AuditService _audit;
    private readonly AccessService _access;
    public GrantService(IDocumentStore store, RequestContext ctx, AuditService audit, AccessService access) { _store = store; _ctx = ctx; _audit = audit; _access = access; }

    private List<JsonObject> Trows() => _store.Rows("grants").Where(g => g.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(g.Get("deletedAt"))).ToList();
    private string UserName(string? sub) => _store.Rows("users").FirstOrDefault(u => u.Str("sub") == sub)?.Str("fullName") ?? sub ?? "";
    private string UnitName(string? code) => _store.Rows("orgUnits").FirstOrDefault(u => u.Str("code") == code)?.Str("name") ?? code ?? "";
    private string CatName(string? id) => _store.Rows("categories").FirstOrDefault(c => c.Str("id") == id)?.Str("name") ?? id ?? "";

    public JsonObject Out(JsonObject g)
    {
        var pt = g.Str("principalType"); var pid = g.Str("principalId"); var st = g.Str("scopeType"); var sid = g.Str("scopeId");
        var o = Doc.Merge(g);
        o["principalLabel"] = pt == "user" ? UserName(pid) : pt == "unit" ? UnitName(pid) : pid;
        o["scopeLabel"] = st == "tenant" ? "Toàn trang" : st == "category" ? $"Chuyên mục: {CatName(sid)}" : st == "unit" ? $"Đơn vị: {UnitName(sid)} (gồm đơn vị con)" : $"Bản ghi #{sid}";
        o["createdByName"] = UserName(g.Str("createdBy"));
        return o;
    }

    /// <summary>Kiểm tra + chuẩn hóa trường grant; ném 422 khi sai.</summary>
    private JsonObject Fields(JsonObject b)
    {
        var f = new JsonObject();
        foreach (var k in new[] { "principalType", "principalId", "resourceType", "scopeType", "scopeId", "permissions", "note", "expiresAt" }) if (b.Has(k)) f[k] = b.Get(k)?.DeepClone();
        if (Doc.Truthy(f.Get("principalType")) && !new[] { "user", "unit", "role" }.Contains(f.Str("principalType"))) throw HttpError.Invalid("principalType phải là user | unit | role.");
        if (Doc.Truthy(f.Get("resourceType")) && !new[] { "*", "news", "announcement", "page", "media" }.Contains(f.Str("resourceType"))) throw HttpError.Invalid("resourceType không hợp lệ.");
        if (Doc.Truthy(f.Get("scopeType")) && !new[] { "tenant", "category", "unit", "record" }.Contains(f.Str("scopeType"))) throw HttpError.Invalid("scopeType không hợp lệ.");
        if (Doc.Truthy(f.Get("permissions")))
        {
            var perms = f.Get("permissions") as JsonArray;
            if (perms is null || perms.Count == 0 || perms.Any(p => !GrantPerms.Contains(Doc.AsString(p) ?? ""))) throw HttpError.Invalid("permissions phải là mảng con của view/edit/review/publish/manage.");
        }
        if (f.Str("scopeType") == "tenant") f["scopeId"] = null;
        else if (f.Get("scopeId") is not null) f["scopeId"] = f.Str("scopeId");
        if (f.Str("principalType") == "unit" && Doc.Truthy(f.Get("principalId")) && !_store.Rows("orgUnits").Any(u => u.Str("code") == f.Str("principalId"))) throw HttpError.Invalid("Đơn vị không tồn tại.");
        if (f.Str("principalType") == "user" && Doc.Truthy(f.Get("principalId")) && !_store.Rows("users").Any(u => u.Str("sub") == f.Str("principalId"))) throw HttpError.Invalid("Người dùng không tồn tại trong danh bạ.");
        if (f.Str("scopeType") == "unit" && Doc.Truthy(f.Get("scopeId")) && !_store.Rows("orgUnits").Any(u => u.Str("code") == f.Str("scopeId"))) throw HttpError.Invalid("Đơn vị phạm vi không tồn tại.");
        if (f.Str("scopeType") == "category" && Doc.Truthy(f.Get("scopeId"))
            && !_store.Rows("categories").Any(c => c.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(c.Get("deletedAt")) && c.Str("id") == f.Str("scopeId"))) throw HttpError.Invalid("Chuyên mục không thuộc trang này.");
        return f;
    }

    public JsonObject List(QueryParams q)
    {
        var list = Trows();
        foreach (var k in new[] { "principalType", "principalId", "resourceType", "scopeType", "scopeId" }) if (q.Is(k)) list = list.Where(g => (g.Get(k) is null ? "null" : g.Str(k)) == q[k]).ToList();
        if (q.Is("keyword")) list = list.Where(g => TextUtil.Norm(string.Join(" ", Out(g).Select(kv => Doc.AsString(kv.Value) ?? ""))).Contains(TextUtil.Norm(q["keyword"]))).ToList();
        return Paging.PagedMap(list, q, Out, 500);
    }

    /// <summary>Quyền hiệu lực của một người — để kiểm tra "vì sao A sửa được bài này".</summary>
    public JsonObject Effective(string sub)
    {
        var u = _store.Rows("users").FirstOrDefault(x => x.Str("sub") == sub) ?? throw HttpError.NotFound();
        var roles = u.Get("roles").Strings().ToList();
        var perms = RoleCatalog.PermissionsOf(roles);
        var p = new UserPrincipal(sub, null, null, null, roles, perms, Array.Empty<string>(), u.Get("units").Strings().ToList(), null, null);
        var mine = _access.Policy.Principals(p);
        var now = TimeUtil.NowMs();
        var grants = _store.Rows("grants").Where(g =>
        {
            var r = AccessService.ToGrant(g);
            return r.TenantId == _ctx.Tenant && !r.Deleted && (r.ExpiresAtMs is null || r.ExpiresAtMs > now) && (r.ResourceType is "*" or "news" or "announcement") && mine.Contains($"{r.PrincipalType}:{r.PrincipalId}");
        });
        return new JsonObject { ["user"] = DirectoryService.UserOut(u), ["permissions"] = Doc.ArrOf(perms), ["grants"] = new JsonArray(grants.Select(g => (JsonNode?)Out(g)).ToArray()) };
    }

    public JsonObject Create(JsonObject b)
    {
        var f = Fields(b);
        foreach (var k in new[] { "principalType", "principalId", "scopeType", "permissions" }) if (!Doc.Truthy(f.Get(k))) throw HttpError.Invalid($"Thiếu {k}.");
        if (f.Str("scopeType") != "tenant" && !Doc.Truthy(f.Get("scopeId"))) throw HttpError.Invalid("Thiếu scopeId cho phạm vi đã chọn.");
        var row = _store.Insert("grants", Doc.Merge(Doc.Obj(("tenantId", _ctx.Tenant), ("resourceType", "*"), ("scopeId", null), ("note", null), ("expiresAt", null)), f,
            Doc.Obj(("createdBy", _ctx.User!.Sub), ("createdAt", TimeUtil.NowIso()), ("deletedAt", null))));
        var o = Out(row);
        _audit.Log("grant.create", "grant", Doc.Obj(("id", row.Id()), ("title", $"{o.Str("principalLabel")} → {o.Str("scopeLabel")}")), new JsonObject { ["permissions"] = new JsonArray(null, row.Get("permissions")?.DeepClone()) });
        return o;
    }

    public JsonObject Update(string id, JsonObject b)
    {
        var g = Trows().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound();
        var f = Fields(b);
        var before = g.Copy();
        _store.Update("grants", g.Id(), f);
        _audit.Log("grant.update", "grant", Doc.Obj(("id", g.Id()), ("title", Out(g).Str("principalLabel"))), AuditService.Diff(before, g));
        return Out(g);
    }

    public void Delete(string id)
    {
        var g = Trows().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound();
        _store.Update("grants", g.Id(), Doc.Obj(("deletedAt", TimeUtil.NowIso()), ("deletedBy", _ctx.User!.Sub)));
        _audit.Log("grant.delete", "grant", Doc.Obj(("id", g.Id()), ("title", Out(g).Str("principalLabel"))));
    }
}
