using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Backups;

/// <summary>
/// Sao lưu: chụp toàn bộ dữ liệu CMS (mọi tenant, trừ nhật ký/sao lưu) để tải về hoặc phục hồi — chỉ quản trị hệ thống.
/// Chụp và phục hồi chạy bằng role bảo trì riêng (<see cref="IDataMaintenance"/>, BYPASSRLS), không dùng role của ứng dụng.
/// </summary>
public sealed class BackupService
{
    public const int SchemaVersion = 6;
    private const string AppName = "humg-cms-mock";
    private static readonly string[] Keep = { "backups", "activityLogs" };

    private readonly IDocumentStore _store;
    private readonly IDataMaintenance _maintenance;
    private readonly RequestContext _ctx;
    private readonly AuditService _audit;
    public BackupService(IDocumentStore store, IDataMaintenance maintenance, RequestContext ctx, AuditService audit) { _store = store; _maintenance = maintenance; _ctx = ctx; _audit = audit; }

    private JsonObject Snapshots()
    {
        if (_store.GetMeta("snapshots") is JsonObject s) return s;
        var n = new JsonObject(); _store.SetMeta("snapshots", n); return n;
    }

    private string TakeSnapshot()
    {
        var data = _maintenance.Export();
        if (data["collections"] is JsonObject cols) foreach (var k in Keep) cols.Remove(k);
        var snap = new JsonObject { ["app"] = AppName, ["version"] = SchemaVersion, ["takenAt"] = TimeUtil.NowIso(), ["data"] = data };
        return Doc.Stringify(snap);
    }

    private string? ApplySnapshot(string json)
    {
        JsonObject? snap;
        try { snap = JsonNode.Parse(json) as JsonObject; } catch (JsonException) { return "Tệp sao lưu không phải JSON hợp lệ."; }
        if (snap?.Str("app") != AppName || (snap.Get("data") as JsonObject)?.Get("collections") is not JsonObject) return "Tệp sao lưu không đúng định dạng.";
        if (snap.Long("version") != SchemaVersion) return $"Bản sao lưu thuộc phiên bản dữ liệu {(snap.Get("version") is null ? "1" : snap.Str("version"))}, không khớp phiên bản hiện tại {SchemaVersion}.";
        _store.Discard();
        _maintenance.Import((JsonObject)snap["data"]!.DeepClone(), Keep);
        return null;
    }

    private JsonObject Out(JsonObject b) { var o = Doc.Merge(b); o["hasData"] = Snapshots().ContainsKey(b.Str("id") ?? ""); return o; }

    public JsonObject List(QueryParams q)
    {
        var list = _store.Rows("backups").OrderByDescending(b => TimeUtil.Ts(b.Str("createdAt"))).ThenByDescending(b => b.Id()).ToList();
        return Paging.PagedMap(list, q, Out);
    }

    public JsonObject Create()
    {
        var snap = TakeSnapshot();
        var row = _store.Insert("backups", Doc.Obj(("tenantId", _ctx.Tenant), ("filePath", $"/backup/cms_humg/cms_{TimeUtil.NowMs()}.json"), ("sizeBytes", Encoding.UTF8.GetByteCount(snap)),
            ("trigger", "manual"), ("createdByName", _ctx.User!.Name), ("status", "success"), ("createdAt", TimeUtil.NowIso())));
        var snaps = Snapshots();
        snaps[row.Id().ToString()] = snap;
        foreach (var id in snaps.Select(x => long.Parse(x.Key)).OrderByDescending(x => x).Skip(8).ToList()) snaps.Remove(id.ToString());
        _store.MarkDirty();
        _audit.Log("backup.create", "backup", row.Str("filePath"));
        return Out(row);
    }

    private string? SnapshotText(string id)
    {
        var n = TextUtil.ToNumber(id);
        var key = double.IsNaN(n) ? "" : ((long)n).ToString();
        return Snapshots()[key] is JsonValue v && v.TryGetValue<string>(out var s) ? s : null;
    }

    public (string Json, string FileName) Download(string id) =>
        SnapshotText(id) is { } s ? (s, $"cms-backup-{id}.json") : throw HttpError.NotFound("Bản sao lưu này không còn dữ liệu để tải.");

    public void RestoreFromFile(string? json)
    {
        if (json is null) throw HttpError.Invalid("Thiếu tệp sao lưu.");
        var err = ApplySnapshot(json); if (err is not null) throw HttpError.Invalid(err);
        _audit.Log("backup.restore", "backup", "tệp tải lên");
    }

    public void RestoreFromSnapshot(string id)
    {
        var s = SnapshotText(id) ?? throw HttpError.NotFound("Bản sao lưu này không còn dữ liệu để phục hồi.");
        var err = ApplySnapshot(s); if (err is not null) throw HttpError.Invalid(err);
        _audit.Log("backup.restore", "backup", $"Bản #{id}");
    }

    public void Delete(string id)
    {
        var b = _store.Rows("backups").FirstOrDefault(x => x.IdIs(id)) ?? throw HttpError.NotFound();
        _store.Remove("backups", b.Id());
        Snapshots().Remove(b.Id().ToString());
        _store.MarkDirty();
        _audit.Log("backup.delete", "backup", b.Str("filePath"));
    }
}
