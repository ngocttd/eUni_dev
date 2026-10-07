using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;
using System.Text.RegularExpressions;

namespace HUMG.CMS.Infrastructure.Storage;

public sealed class S3Options
{
    public string Endpoint { get; set; } = "http://127.0.0.1:9000";
    public string AccessKey { get; set; } = "minioadmin";
    public string SecretKey { get; set; } = "minioadmin";
    public string Region { get; set; } = "us-east-1";
    /// <summary>Bucket file công khai (tin tức, trang). File đính kèm thông báo dùng bucket riêng cms-private (presigned URL) — giai đoạn sau.</summary>
    public string Bucket { get; set; } = "cms-public";
    public bool ForcePathStyle { get; set; } = true;
}

/// <summary>
/// Object storage tương thích S3 (MinIO): object_key theo quy ước schema v2 <c>{tenant}/yyyy/MM/{uuid}.{ext}</c>.
/// Metadata file nằm ở bảng <c>cms.media</c> (PostgreSQL); upload và ghi DB được bù trừ ở <c>MediaService</c> (xóa object nếu DB hủy).
/// </summary>
public sealed class S3FileStorage : IFileStorage, IDisposable
{
    private readonly AmazonS3Client _s3;
    private readonly string _bucket;
    private volatile bool _bucketReady;

    public S3FileStorage(S3Options o)
    {
        _bucket = o.Bucket;
        _s3 = new AmazonS3Client(new BasicAWSCredentials(o.AccessKey, o.SecretKey),
            new AmazonS3Config { ServiceURL = o.Endpoint, ForcePathStyle = o.ForcePathStyle, AuthenticationRegion = o.Region });
    }

    private async Task EnsureBucketAsync(CancellationToken ct)
    {
        if (_bucketReady) return;
        try { await _s3.PutBucketAsync(new PutBucketRequest { BucketName = _bucket }, ct); }
        catch (AmazonS3Exception e) when (e.ErrorCode is "BucketAlreadyOwnedByYou" or "BucketAlreadyExists") { /* đã có */ }
        _bucketReady = true;
    }

    public async Task<StoredFile> SaveAsync(Stream content, string originalName, string tenant, string? contentType, CancellationToken ct = default)
    {
        await EnsureBucketAsync(ct);
        var ext = Regex.Match(originalName, @"\.[^.]+$").Value.ToLowerInvariant();
        var now = DateTime.UtcNow;
        var key = $"{tenant}/{now:yyyy}/{now:MM}/{Guid.NewGuid():N}{ext}";
        await using var buffer = new MemoryStream();   // cần độ dài trước khi gửi (S3 không nhận stream không rõ kích thước)
        await content.CopyToAsync(buffer, ct); buffer.Position = 0;
        await _s3.PutObjectAsync(new PutObjectRequest { BucketName = _bucket, Key = key, InputStream = buffer, ContentType = contentType ?? "application/octet-stream", AutoCloseStream = false, DisablePayloadSigning = false }, ct);
        return new StoredFile(key, buffer.Length);
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        try { await _s3.DeleteObjectAsync(new DeleteObjectRequest { BucketName = _bucket, Key = key }, ct); }
        catch (AmazonS3Exception e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound) { /* đã xóa */ }
    }

    public async Task<StoredObject?> OpenReadAsync(string key, CancellationToken ct = default)
    {
        try
        {
            var r = await _s3.GetObjectAsync(_bucket, key, ct);
            return new StoredObject(r.ResponseStream, r.Headers.ContentType ?? "application/octet-stream", r.ContentLength);
        }
        catch (AmazonS3Exception e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound) { return null; }
    }

    public void Dispose() => _s3.Dispose();
}
