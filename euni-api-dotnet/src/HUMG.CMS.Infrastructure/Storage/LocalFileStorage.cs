using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Storage;

/// <summary>Lưu file media trên đĩa (mock). Bản thật: adapter MinIO (bucket cms-public / cms-private) cài cùng interface.</summary>
public sealed class LocalFileStorage : IFileStorage
{
    private readonly string _dir;
    public LocalFileStorage(string dir) { _dir = dir; Directory.CreateDirectory(dir); }

    public async Task<StoredFile> SaveAsync(Stream content, string originalName, CancellationToken ct = default)
    {
        var m = Regex.Match(originalName, @"\.[^.]+$");
        var ext = m.Success ? m.Value : "";
        var stem = ext.Length > 0 ? originalName[..^ext.Length] : originalName;
        var key = $"{TimeUtil.NowMs()}-{TextUtil.Slugify(stem)}{ext}";
        var path = Path.Combine(_dir, key);
        await using (var fs = File.Create(path)) await content.CopyToAsync(fs, ct);
        return new StoredFile(key, new FileInfo(path).Length);
    }
}
