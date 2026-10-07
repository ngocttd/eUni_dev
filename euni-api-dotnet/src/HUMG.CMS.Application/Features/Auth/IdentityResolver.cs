using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Auth;

/// <summary>
/// Ghép người dùng từ token của nhà cung cấp định danh (Entra ID, Identity Server) với danh bạ CMS (bản sao chỉ đọc đồng bộ từ IdS/QLNS/QLĐT):
/// khớp theo <c>sub</c>, nếu không có thì theo email/UPN. Role của token và của danh bạ được hợp nhất; đơn vị, tenant, mã cán bộ/sinh viên lấy từ danh bạ.
/// Người dùng bị khóa trong danh bạ → từ chối. Người chưa có trong danh bạ vẫn dùng được với quyền suy từ token (thường chỉ cổng cá nhân),
/// còn quyền quản trị CMS luôn cần role CMS (token hoặc danh bạ) VÀ grant trong bảng phân quyền.
/// </summary>
public sealed class IdentityResolver
{
    private readonly IDocumentStore _store;
    private readonly IdentityOptions _opt;
    public IdentityResolver(IDocumentStore store, IdentityOptions opt) { _store = store; _opt = opt; }

    public UserPrincipal? Resolve(UserPrincipal token)
    {
        var p = FromDirectory(token);
        // Quản trị viên đầu tiên (khi danh bạ thật chưa đồng bộ): email do nhà cung cấp định danh xác thực nằm trong CMS_BOOTSTRAP_ADMINS → cms.admin
        if (p is not null && !string.IsNullOrEmpty(p.Email) && _opt.BootstrapAdmins.Contains(p.Email.Trim().ToLowerInvariant()) && !p.Roles.Contains("cms.admin"))
        {
            var roles = p.Roles.Concat(new[] { "cms.admin" }).Distinct().ToList();
            p = p with { Roles = roles, Perms = RoleCatalog.PermissionsOf(roles) };
        }
        return p;
    }

    private UserPrincipal? FromDirectory(UserPrincipal token)
    {
        var users = _store.Rows("users");
        var email = token.Email?.Trim().ToLowerInvariant();
        var u = users.FirstOrDefault(x => x.Str("sub") == token.Sub)
            ?? (string.IsNullOrEmpty(email) ? null : users.FirstOrDefault(x => string.Equals(x.Str("email"), email, StringComparison.OrdinalIgnoreCase) || string.Equals(x.Str("username"), email, StringComparison.OrdinalIgnoreCase)));
        if (u is null) return token;
        if (u.Long("status") != 1) return null;
        var roles = token.Roles.Concat(u.Get("roles").Strings()).Distinct().ToList();
        var tenants = u.Get("tenants") is System.Text.Json.Nodes.JsonArray ? u.Get("tenants").Strings().ToList() : token.Tenants.ToList();
        return new UserPrincipal(u.Str("sub")!, token.Name ?? u.Str("fullName"), token.Email ?? u.Str("email"), null, roles, RoleCatalog.PermissionsOf(roles), tenants,
            token.Units.Concat(u.Get("units").Strings()).Distinct().ToList(), Doc.Truthy(u.Get("staffCode")) ? u.Str("staffCode") : token.StaffCode, Doc.Truthy(u.Get("studentCode")) ? u.Str("studentCode") : token.StudentCode);
    }
}

/// <summary>Cấu hình danh tính phía CMS (không phải của nhà cung cấp định danh).</summary>
public sealed class IdentityOptions
{
    /// <summary>Email (chữ thường) được tự động cấp vai trò cms.admin khi đăng nhập qua SSO — để có tài khoản quản trị đầu tiên trước khi đồng bộ danh bạ thật.</summary>
    public HashSet<string> BootstrapAdmins { get; set; } = new();
}
