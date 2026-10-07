using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Storage;

/// <summary>Lưu file media trên đĩa (dev). Bản chạy thật dùng <see cref="S3FileStorage"/> (MinIO).</summary>
public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _dir;
    public LocalFileStorage(string dir) { _dir = dir; Directory.CreateDirectory(dir); }

    public async Task<StoredFile> SaveAsync(Stream content, string originalName, string tenant, string? contentType, CancellationToken ct = default)
    {
        var m = Regex.Match(originalName, @"\.[^.]+$");
        var ext = m.Success ? m.Value : "";
        var stem = ext.Length > 0 ? originalName[..^ext.Length] : originalName;
        var key = $"{TimeUtil.NowMs()}-{TextUtil.Slugify(stem)}{ext}";
        var path = Path.Combine(_dir, key);
        await using (var fs = File.Create(path)) await content.CopyToAsync(fs, ct);
        return new StoredFile(key, new FileInfo(path).Length);
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var path = Path.GetFullPath(Path.Combine(_dir, key));
        if (path.StartsWith(Path.GetFullPath(_dir)) && File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public Task<StoredObject?> OpenReadAsync(string key, CancellationToken ct = default)
    {
        var path = Path.GetFullPath(Path.Combine(_dir, key));
        if (!path.StartsWith(Path.GetFullPath(_dir)) || !File.Exists(path)) return Task.FromResult<StoredObject?>(null);
        return Task.FromResult<StoredObject?>(new StoredObject(File.OpenRead(path), "application/octet-stream", new FileInfo(path).Length));
    }
}
