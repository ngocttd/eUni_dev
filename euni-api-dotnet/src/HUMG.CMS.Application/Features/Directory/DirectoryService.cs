using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features;

/// <summary>Bản sao chỉ đọc của danh bạ (Identity Server) và cây đơn vị (QLNS/QLĐT). CMS không quản lý user/role.</summary>
public sealed class DirectoryService
{
    private readonly IDocumentStore _store;
    private readonly AccessService _access;
    public DirectoryService(IDocumentStore store, AccessService access) { _store = store; _access = access; }

    public static JsonObject UserOut(JsonObject u) => new()
    {
        ["sub"] = u.Str("sub"), ["name"] = u.Str("fullName"), ["email"] = u.Get("email")?.DeepClone(), ["staffCode"] = u.Get("staffCode")?.DeepClone(), ["studentCode"] = u.Get("studentCode")?.DeepClone(),
        ["roles"] = u.Get("roles")?.DeepClone(), ["units"] = u.Get("units")?.DeepClone(), ["active"] = u.Long("status") == 1,
    };

    public JsonArray OrgUnits()
    {
        var list = _store.Rows("orgUnits").Select(u =>
        {
            var chain = _access.WithAncestors(new[] { u.Str("code") ?? "" });
            var o = Doc.Merge(u); o["depth"] = chain.Count - 1; o["path"] = string.Join(".", Enumerable.Reverse(chain));
            return o;
        }).OrderBy(o => o.Str("path"), StringComparer.Ordinal);
        return new JsonArray(list.Select(o => (JsonNode?)o).ToArray());
    }

    public JsonObject Users(QueryParams q)
    {
        var kw = TextUtil.Norm(q["keyword"]);
        var list = _store.Rows("users");
        if (kw.Length > 0) list = list.Where(u => TextUtil.Norm(string.Join(" ", new[] { u.Str("fullName"), u.Str("email"), u.Str("username"), u.Str("staffCode"), u.Str("studentCode") }.Select(x => x ?? ""))).Contains(kw)).ToList();
        if (q.Is("role")) list = list.Where(u => u.Get("roles").Strings().Contains(q["role"]!)).ToList();
        return Paging.PagedMap(list, q, UserOut, 20);
    }

    public JsonObject User(string sub) => UserOut(_store.Rows("users").FirstOrDefault(x => x.Str("sub") == sub) ?? throw HttpError.NotFound());

    /// <summary>Danh mục role trên SSO: realm role (tầng 1) + client role của các app (tầng 2); permissions = quyền chức năng trong CMS.</summary>
    public JsonArray Roles()
    {
        JsonObject Row(string code, string label, string kind, string? client) => new()
        {
            ["code"] = code, ["label"] = label, ["kind"] = kind, ["client"] = client,
            ["permissions"] = Doc.ArrOf(RoleCatalog.RolePermissions.TryGetValue(code, out var p) ? p : Array.Empty<string>()),
        };
        var rows = RoleCatalog.RealmRoles.Select(r => Row(r.Code, r.Label, "realm", null))
            .Concat(RoleCatalog.ClientRoles.SelectMany(c => c.Roles.Select(r => Row(r.Code, r.Label, "client", c.Client))));
        return new JsonArray(rows.Select(r => (JsonNode?)r).ToArray());
    }
}
