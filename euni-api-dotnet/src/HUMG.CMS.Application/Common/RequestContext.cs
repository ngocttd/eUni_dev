using HUMG.CMS.Domain.AccessControl;

namespace HUMG.CMS.Application.Common;

/// <summary>Ngữ cảnh một request: tenant (chỉ là phạm vi, KHÔNG phải bằng chứng quyền), người dùng từ token, thông tin audit.</summary>
public sealed class RequestContext
{
    public string Tenant { get; set; } = "humg";
    /// <summary>Header <c>X-Tenant: *</c> — mọi trang mà người dùng thuộc về (chỉ dùng cho hộp thư).</summary>
    public bool AllTenants { get; set; }
    /// <summary>
    /// Các tenant được ĐỌC trong request (RLS). Mặc định chỉ <see cref="Tenant"/>; mở rộng cho hộp thư đa trang (<c>X-Tenant: *</c>),
    /// ngữ cảnh người dùng và quản lý trang đơn vị. Ghi luôn theo tenant của từng bản ghi.
    /// </summary>
    public IReadOnlyList<string>? ReadTenants { get; set; }
    public UserPrincipal? User { get; set; }
    public string? Ip { get; set; }
    public string? UserAgent { get; set; }
    public string? IfMatch { get; set; }
}
