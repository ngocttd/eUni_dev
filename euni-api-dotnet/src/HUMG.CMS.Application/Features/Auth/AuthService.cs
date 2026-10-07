using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Auth;

/// <summary>
/// auth-api mock — đóng vai Identity Server khi phát triển. Hệ thống thật: user, role, tenant, đơn vị do IdS quản lý;
/// CMS chỉ đọc claim trong token (docs/design/CMS_DESIGN.md §3, §5).
/// </summary>
public sealed class AuthService
{
    public const string DevPassword = "Humg@2025";
    private readonly IDocumentStore _store;
    private readonly ITokenService _tokens;
    public AuthService(IDocumentStore store, ITokenService tokens) { _store = store; _tokens = tokens; }

    /// <summary>Người dùng (dạng FE dùng) từ một dòng danh bạ IdS. <c>role</c> = vai trò chính để điều hướng FE.</summary>
    public static JsonObject UserView(JsonObject u)
    {
        var roles = u.Get("roles").Strings().ToList();
        var cmsRole = RoleCatalog.CmsOrder.FirstOrDefault(roles.Contains);
        var portalRole = RoleCatalog.PortalRoles.FirstOrDefault(roles.Contains);
        var role = cmsRole is not null ? (cmsRole == "cms.admin" ? "cms-admin" : "cms-editor") : portalRole ?? "student";
        var tenants = u.Get("tenants") is JsonArray ta && ta.Count >= 0 ? u.Get("tenants")!.Clone() : Doc.ArrOf(new[] { "humg" });
        var units = u.Get("units") is JsonArray ? u.Get("units")!.Clone() : new JsonArray();
        return new JsonObject
        {
            ["id"] = u.Str("sub"), ["sub"] = u.Str("sub"), ["username"] = u.Str("username"), ["name"] = u.Str("fullName"), ["email"] = u.Str("email"),
            ["role"] = role, ["roles"] = Doc.ArrOf(roles),
            ["roleLabel"] = cmsRole is not null && RoleCatalog.RoleLabel.TryGetValue(cmsRole, out var l) ? l : null,
            ["permissions"] = Doc.ArrOf(RoleCatalog.PermissionsOf(roles)), ["tenants"] = tenants, ["units"] = units,
            ["staffCode"] = Doc.Truthy(u.Get("staffCode")) ? u.Str("staffCode") : null,
            ["studentCode"] = Doc.Truthy(u.Get("studentCode")) ? u.Str("studentCode") : null,
            ["portal"] = cmsRole is not null ? "/cms" : (RoleCatalog.PortalOf.TryGetValue(role, out var p) ? p : "/"),
        };
    }

    private string Sign(JsonObject u) => _tokens.Issue(new Dictionary<string, object?>
    {
        ["sub"] = u.Str("sub"), ["name"] = u.Str("name"), ["email"] = u.Str("email"), ["role"] = u.Str("role"),
        ["roles"] = u.Get("roles").Strings().ToArray(), ["perms"] = u.Get("permissions").Strings().ToArray(),
        ["tenants"] = u.Get("tenants").Strings().ToArray(), ["units"] = u.Get("units").Strings().ToArray(),
        ["staff_code"] = u.Str("staffCode"), ["student_code"] = u.Str("studentCode"),
    });

    private JsonObject? FindUser(string key) => _store.Rows("users").FirstOrDefault(u =>
        new[] { u.Str("username"), u.Str("email"), u.Str("staffCode"), u.Str("studentCode") }.Any(v => !string.IsNullOrEmpty(v) && v.ToLowerInvariant() == key));

    private static string ResolvePortalRole(string v) =>
        v.Contains("lanh") || v.Contains("leader") || v.Contains("manager") ? "manager"
        : v.Contains("phu") || v.Contains("parent") ? "parent"
        : v.Contains("giang") || v.Contains("lecturer") || v.Contains("gv") ? "lecturer"
        : v.Contains("can-bo") || v.Contains("canbo") || v.Contains("staff") ? "staff" : "student";

    private JsonObject Demo(string role) => UserView(_store.Rows("users").First(x => x.Str("sub") == RoleCatalog.DemoSub[role]));

    /// <summary>
    /// Đăng nhập mock: <c>{ role }</c> vào thẳng cổng demo, hoặc <c>{ username, password }</c> theo danh bạ.
    /// Tài khoản có vai trò CMS cần mật khẩu <c>Humg@2025</c>; tài khoản portal mock nhận mật khẩu bất kỳ.
    /// </summary>
    public JsonObject Login(JsonObject body)
    {
        if (!_tokens.CanIssue) throw new HttpError(501, "Đăng nhập do Identity Server đảm nhiệm (AUTH_MODE=oidc); auth-api mock đã tắt.");
        var role = body.Str("role");
        var demoRole = role == "leader" ? "manager" : role;
        if (!string.IsNullOrEmpty(demoRole) && RoleCatalog.DemoSub.ContainsKey(demoRole))
        {
            var du = Demo(demoRole);
            return new JsonObject { ["accessToken"] = Sign(du), ["user"] = du };
        }
        var key = (Doc.Truthy(body.Get("username")) ? body.Str("username")! : "").Trim().ToLowerInvariant();
        if (key.Length == 0) throw HttpError.Invalid("Thiếu tên đăng nhập.");
        var found = FindUser(key);
        if (found is not null)
        {
            if (found.Long("status") != 1) throw HttpError.Forbidden("Tài khoản đã bị khóa.");
            var u = UserView(found);
            if (u.Get("roles").Strings().Any(r => r.StartsWith("cms.")) && body.Str("password") != DevPassword) throw HttpError.Unauthorized("Sai tên đăng nhập hoặc mật khẩu.");
            found["lastLoginAt"] = TimeUtil.NowIso();
            return new JsonObject { ["accessToken"] = Sign(u), ["user"] = u };
        }
        var du2 = Demo(ResolvePortalRole(key));
        var user = Doc.Merge(du2); user["username"] = key;
        return new JsonObject { ["accessToken"] = Sign(du2), ["user"] = user };
    }

    private JsonObject? Current(UserPrincipal? t)
    {
        var u = t is null ? null : _store.Rows("users").FirstOrDefault(x => x.Str("sub") == t.Sub);
        return u is not null && u.Long("status") == 1 ? UserView(u) : null;
    }

    public JsonObject Me(UserPrincipal? t) =>
        Current(t) is { } u ? new JsonObject { ["user"] = u } : throw HttpError.Unauthorized("Chưa đăng nhập.");

    public JsonObject Refresh(UserPrincipal? t) =>
        !_tokens.CanIssue ? throw new HttpError(501, "Làm mới token do Identity Server đảm nhiệm (AUTH_MODE=oidc).") : Current(t) is { } u ? new JsonObject { ["accessToken"] = Sign(u), ["user"] = u.DeepClone() } : throw HttpError.Unauthorized("Phiên đã hết hạn.");
}
