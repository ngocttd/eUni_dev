using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Media;

public sealed record UploadRequest(Stream Content, string FileName, string? ContentType, string? AltText, string? Caption, string? Folder);

/// <summary>
/// Thư viện media theo tenant: metadata ở kho dữ liệu, file ở <see cref="IFileStorage"/> (mock: đĩa cục bộ; thật: MinIO bucket cms-public / cms-private).
/// URL trả về là đường dẫn TƯƠNG ĐỐI theo gateway (<c>cms-api/uploads/x.png</c>) để không làm mất tiền tố base URL.
/// </summary>
public sealed class MediaService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly IFileStorage _files;
    private readonly AuditService _audit;
    public MediaService(IDocumentStore store, RequestContext ctx, IFileStorage files, AuditService audit) { _store = store; _ctx = ctx; _files = files; _audit = audit; }

    private List<JsonObject> Trows() => _store.Rows("media").Where(r => r.Str("tenantId") == _ctx.Tenant && !Doc.Truthy(r.Get("deletedAt"))).ToList();

    private static string KindOf(string? mime, string ext)
    {
        mime ??= "";
        return mime.StartsWith("image/") ? "image" : mime.StartsWith("video/") ? "video" : mime.StartsWith("audio/") ? "audio"
            : Regex.IsMatch(ext + mime, "pdf|doc|xls|ppt|txt", RegexOptions.IgnoreCase) ? "document" : "other";
    }

    public JsonObject List(QueryParams q)
    {
        var l = Trows().OrderByDescending(m => m.Str("createdAt") ?? "", StringComparer.Ordinal).ToList();
        if (q.Is("kind")) l = l.Where(m => m.Str("kind") == q["kind"]).ToList();
        if (q.Is("folder")) l = l.Where(m => m.Str("folder") == q["folder"]).ToList();
        if (q.Is("keyword")) l = l.Where(m => TextUtil.Norm(m.Str("fileName")).Contains(TextUtil.Norm(q["keyword"]))).ToList();
        return Paging.Paged(l, q);
    }

    public JsonObject Get(string id) => (Trows().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound()).Copy();

    public async Task<JsonObject> UploadAsync(UploadRequest req, CancellationToken ct)
    {
        var name = req.FileName;
        var m = Regex.Match(name, @"\.([^.]+)$");
        var ext = m.Success ? m.Groups[1].Value.ToLowerInvariant() : "";
        var stored = await _files.SaveAsync(req.Content, name, ct);
        var row = _store.Insert("media", new JsonObject
        {
            ["tenantId"] = _ctx.Tenant, ["fileName"] = name, ["kind"] = KindOf(req.ContentType, ext), ["ext"] = ext, ["mimeType"] = req.ContentType, ["sizeBytes"] = stored.SizeBytes,
            ["url"] = $"cms-api/uploads/{stored.Key}", ["altText"] = req.AltText, ["caption"] = req.Caption, ["folder"] = req.Folder, ["uploadedBy"] = _ctx.User!.Sub,
            ["createdAt"] = TimeUtil.NowIso(), ["deletedAt"] = null,
        });
        _audit.Log("media.upload", "media", row);
        return row.Copy();
    }

    public void Delete(string id)
    {
        var m = Trows().FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound();
        _store.Update("media", m.Id(), Doc.Obj(("deletedAt", TimeUtil.NowIso()), ("deletedBy", _ctx.User!.Sub)));
        _audit.Log("media.delete", "media", m);
    }
}
