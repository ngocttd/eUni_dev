using HUMG.CMS.Domain.AccessControl;

namespace HUMG.CMS.Application.Abstractions;

public interface ITokenService
{
    /// <summary>true: tự phát hành token (mock đóng vai Identity Server); false: chỉ kiểm tra token do IdS thật phát hành.</summary>
    bool CanIssue { get; }
    /// <summary>true: token không mang đủ role/đơn vị/tenant của CMS → <c>IdentityResolver</c> bổ sung từ danh bạ (khớp theo sub hoặc email).</summary>
    bool ResolvesFromDirectory { get; }
    /// <summary>Phát hành token (mock: đóng vai Identity Server).</summary>
    string Issue(IReadOnlyDictionary<string, object?> claims);
    /// <summary>Đọc và kiểm tra token từ header Authorization; null nếu thiếu/sai/hết hạn.</summary>
    UserPrincipal? Read(string? authorizationHeader);
}

public sealed record StoredFile(string Key, long SizeBytes);
public sealed record StoredObject(Stream Content, string ContentType, long? Length);

/// <summary>Object storage cho file media (mock: đĩa; thật: MinIO/S3 bucket <c>cms-public</c>).</summary>
public interface IFileStorage
{
    /// <summary>Lưu file tải lên; <c>Key</c> là object_key trong kho (URL công khai: <c>cms-api/uploads/{Key}</c>).</summary>
    Task<StoredFile> SaveAsync(Stream content, string originalName, string tenant, string? contentType, CancellationToken ct = default);
    /// <summary>Xóa file (dùng để bù trừ khi ghi database thất bại). Không tồn tại → coi như đã xóa; lỗi khác được ném.</summary>
    Task DeleteAsync(string key, CancellationToken ct = default);
    Task<StoredObject?> OpenReadAsync(string key, CancellationToken ct = default);
}
