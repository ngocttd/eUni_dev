using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.AccessControl;

/// <summary>
/// Kiểm tra token + quyền chức năng + tenant cho từng lệnh. Tenant từ X-Tenant/host chỉ là phạm vi request,
/// không phải bằng chứng người dùng có quyền — quyền được suy từ token và grants.
/// </summary>
public sealed class AuthorizationService
{
    private readonly RequestContext _ctx;
    private readonly AccessService _access;
    public AuthorizationService(RequestContext ctx, AccessService access) { _ctx = ctx; _access = access; }

    public UserPrincipal RequireUser() =>
        _ctx.User ?? throw HttpError.Unauthorized("Chưa đăng nhập hoặc phiên đã hết hạn.");

    /// <summary>Bắt buộc đăng nhập CMS + quyền chức năng (tùy chọn) + được quản trị tenant đang chọn. Quyền mức bản ghi kiểm tra tiếp trong use case.</summary>
    public UserPrincipal RequireCms(string? perm = null)
    {
        var t = RequireUser();
        if (!RoleCatalog.HasPerm(t.Perms.ToList(), "cms.access")) throw HttpError.Forbidden("Tài khoản không có quyền truy cập CMS.");
        if (!RoleCatalog.IsSuper(t.Perms) && !_access.TenantsOf(t).Contains(_ctx.Tenant)) throw HttpError.Forbidden($"Tài khoản không được quản trị trang \"{_ctx.Tenant}\".");
        if (perm is not null && !RoleCatalog.HasPerm(t.Perms.ToList(), perm)) throw HttpError.Forbidden($"Thiếu quyền {perm}.");
        return t;
    }

    public UserPrincipal RequireSuper()
    {
        var t = RequireCms();
        if (!RoleCatalog.IsSuper(t.Perms)) throw HttpError.Forbidden("Chỉ quản trị CMS (cms.admin) được quản lý trang đơn vị.");
        return t;
    }
}
