namespace HUMG.CMS.Domain.AccessControl;

/// <summary>Người dùng đã xác thực — dựng từ claim trong token (SSO), không đọc từ CSDL của CMS.</summary>
public sealed record UserPrincipal(
    string Sub, string? Name, string? Email, string? Role,
    IReadOnlyList<string> Roles, IReadOnlyList<string> Perms, IReadOnlyList<string> Tenants, IReadOnlyList<string> Units,
    string? StaffCode, string? StudentCode);

/// <summary>Một dòng cấp quyền (grant) mức tenant / chuyên mục / đơn vị / bản ghi.</summary>
public sealed record GrantRef(
    string TenantId, string PrincipalType, string PrincipalId, string ResourceType, string ScopeType, string? ScopeId,
    IReadOnlyList<string> Permissions, long? ExpiresAtMs, bool Deleted);

/// <summary>Phần của bản ghi cần cho kiểm tra quyền.</summary>
public sealed record RecordRef(
    long Id, string? CategoryId, string? OwnerUnitCode, string? CreatedBy, string? Status, bool Deleted, bool HasPendingRevision);
