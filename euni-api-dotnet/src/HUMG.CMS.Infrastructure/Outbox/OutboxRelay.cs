using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.Common;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace HUMG.CMS.Infrastructure.Outbox;

/// <summary>
/// Đẩy sự kiện trong bảng <c>cms.outbox</c> cho các <see cref="IOutboxHandler"/>. Chạy cùng deployment với API (BackgroundService), tách riêng được sau này.
/// Nhiều instance chạy song song an toàn nhờ <c>FOR UPDATE SKIP LOCKED</c>; chỉ lấy sự kiện đã đến hạn (<c>available_at ≤ now()</c>);
/// lỗi → tăng <c>attempts</c>, ghi <c>last_error</c>, lùi <c>available_at</c> theo cấp số nhân; quá số lần thử thì dừng (để người vận hành xem).
/// Dùng role bảo trì (đọc xuyên tenant); handler tự mở ngữ cảnh tenant (RLS) cho nghiệp vụ của nó.
/// </summary>
public sealed class OutboxRelay : BackgroundService
{
    public const int MaxAttempts = 8;
    private readonly NpgsqlDataSource _admin;
    private readonly IEnumerable<IOutboxHandler> _handlers;
    private readonly ILogger<OutboxRelay> _log;
    private readonly TimeSpan _poll;

    public OutboxRelay(NpgsqlDataSource adminSource, IEnumerable<IOutboxHandler> handlers, ILogger<OutboxRelay> log, TimeSpan poll)
    { _admin = adminSource; _handlers = handlers; _log = log; _poll = poll; }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try { while (await ProcessOnceAsync(ct) > 0) { } }
            catch (Exception e) when (e is not OperationCanceledException) { _log.LogError(e, "Outbox relay lỗi"); }
            try { await Task.Delay(_poll, ct); } catch (OperationCanceledException) { break; }
        }
    }

    /// <summary>Xử lý một lô sự kiện đã đến hạn; trả số sự kiện đã lấy.</summary>
    public async Task<int> ProcessOnceAsync(CancellationToken ct = default)
    {
        await using var conn = await _admin.OpenConnectionAsync(ct);
        await using var tx = await conn.BeginTransactionAsync(ct);
        var batch = new List<OutboxMessage>();
        await using (var cmd = new NpgsqlCommand(@"SELECT id, tenant_id, type, payload::text, attempts FROM cms.outbox
                WHERE processed_at IS NULL AND available_at <= now() AND attempts < @max ORDER BY available_at, id LIMIT 20 FOR UPDATE SKIP LOCKED", conn, tx))
        {
            cmd.Parameters.AddWithValue("max", MaxAttempts);
            await using var rd = await cmd.ExecuteReaderAsync(ct);
            while (await rd.ReadAsync(ct)) batch.Add(new OutboxMessage(rd.GetInt64(0), rd.GetString(1), rd.GetString(2), (JsonObject)JsonNode.Parse(rd.GetString(3))!, rd.GetInt32(4)));
        }
        foreach (var m in batch)
        {
            string? error = null;
            try { foreach (var h in _handlers.Where(h => h.Handles(m.Type))) await h.HandleAsync(m, ct); }
            catch (Exception e) when (e is not OperationCanceledException) { error = e.Message; _log.LogWarning(e, "Outbox {Id} {Type} lỗi (lần {N})", m.Id, m.Type, m.Attempts + 1); }
            await using var upd = new NpgsqlCommand(error is null
                ? "UPDATE cms.outbox SET processed_at = now(), attempts = attempts + 1, last_error = NULL WHERE id = @id"
                : "UPDATE cms.outbox SET attempts = attempts + 1, last_error = @e, available_at = now() + (power(2, attempts + 1) * interval '10 seconds') WHERE id = @id", conn, tx);
            upd.Parameters.AddWithValue("id", m.Id);
            if (error is not null) upd.Parameters.AddWithValue("e", error);
            await upd.ExecuteNonQueryAsync(ct);
        }
        await tx.CommitAsync(ct);
        return batch.Count;
    }
}

/// <summary>Ghi nhật ký mọi sự kiện (điểm gắn xóa cache / gửi sang dịch vụ khác).</summary>
public sealed class LoggingOutboxHandler : IOutboxHandler
{
    private readonly ILogger<LoggingOutboxHandler> _log;
    public LoggingOutboxHandler(ILogger<LoggingOutboxHandler> log) => _log = log;
    public bool Handles(string type) => true;
    public Task HandleAsync(OutboxMessage m, CancellationToken ct) { _log.LogInformation("Outbox {Type} tenant={Tenant} {Payload}", m.Type, m.TenantId, Doc.Stringify(m.Payload)); return Task.CompletedTask; }
}
