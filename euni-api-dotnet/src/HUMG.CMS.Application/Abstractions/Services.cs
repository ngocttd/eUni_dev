using HUMG.CMS.Domain.AccessControl;

namespace HUMG.CMS.Application.Abstractions;

public interface ITokenService
{
    /// <summary>Phát hành token (mock: đóng vai Identity Server).</summary>
    string Issue(IReadOnlyDictionary<string, object?> claims);
    /// <summary>Đọc và kiểm tra token từ header Authorization; null nếu thiếu/sai/hết hạn.</summary>
    UserPrincipal? Read(string? authorizationHeader);
}

public sealed record StoredFile(string Key, long SizeBytes);

public interface IFileStorage
{
    /// <summary>Lưu file tải lên; <c>Key</c> là tên file trong kho (URL công khai: <c>cms-api/uploads/{Key}</c>).</summary>
    Task<StoredFile> SaveAsync(Stream content, string originalName, CancellationToken ct = default);
}
