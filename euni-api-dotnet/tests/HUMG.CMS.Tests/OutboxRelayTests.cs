using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Infrastructure.Outbox;
using Microsoft.Extensions.Logging.Abstractions;
using Npgsql;
using Xunit;

namespace HUMG.CMS.Tests;

[Collection("postgres")]
public class OutboxRelayTests
{
    private static readonly string? AdminUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_ADMIN_URL");

    private sealed class Capture : IOutboxHandler
    {
        public List<long> Seen = new(); public bool Fail;
        public bool Handles(string type) => type.StartsWith("TestEvt");
        public Task HandleAsync(OutboxMessage m, CancellationToken ct) { Seen.Add(m.Id); return Fail ? throw new InvalidOperationException("boom") : Task.CompletedTask; }
    }

    private static long Enqueue(NpgsqlDataSource admin, string type, string availableAt)
    {
        using var c = admin.OpenConnection();
        using var cmd = new NpgsqlCommand("INSERT INTO cms.outbox (tenant_id, type, payload, available_at) VALUES ('humg', @t, '{}'::jsonb, @a::timestamptz) RETURNING id", c);
        cmd.Parameters.AddWithValue("t", type); cmd.Parameters.AddWithValue("a", availableAt);
        return (long)cmd.ExecuteScalar()!;
    }
    private static (bool processed, int attempts, string? err, DateTime avail) State(NpgsqlDataSource admin, long id)
    {
        using var c = admin.OpenConnection();
        using var cmd = new NpgsqlCommand("SELECT processed_at IS NOT NULL, attempts, last_error, available_at FROM cms.outbox WHERE id = @i", c);
        cmd.Parameters.AddWithValue("i", id);
        using var r = cmd.ExecuteReader(); r.Read();
        return (r.GetBoolean(0), r.GetInt32(1), r.IsDBNull(2) ? null : r.GetString(2), r.GetDateTime(3));
    }

    [SkippableFact]
    public async Task Chi_xu_ly_su_kien_da_den_han_va_danh_dau_da_xu_ly()
    {
        if (AdminUrl is null) return;
        var admin = NpgsqlDataSource.Create(AdminUrl);
        new HUMG.CMS.Infrastructure.Persistence.PostgresDataMaintenance(admin, new HUMG.CMS.Infrastructure.Storage.FileMockData(Path.Combine(Root(), "mock-data")), true).EnsureReady();
        var cap = new Capture();
        var relay = new OutboxRelay(admin, new IOutboxHandler[] { cap }, NullLogger<OutboxRelay>.Instance, TimeSpan.FromSeconds(1));
        var due = Enqueue(admin, "TestEvtDue", DateTime.UtcNow.AddMinutes(-1).ToString("o"));
        var later = Enqueue(admin, "TestEvtScheduled", DateTime.UtcNow.AddHours(1).ToString("o"));   // hẹn giờ xuất bản trong tương lai
        await relay.ProcessOnceAsync();
        Assert.Contains(due, cap.Seen); Assert.DoesNotContain(later, cap.Seen);
        Assert.True(State(admin, due).processed); Assert.False(State(admin, later).processed);
    }

    [SkippableFact]
    public async Task Loi_thi_tang_attempts_ghi_last_error_va_lui_available_at()
    {
        if (AdminUrl is null) return;
        var admin = NpgsqlDataSource.Create(AdminUrl);
        var cap = new Capture { Fail = true };
        var relay = new OutboxRelay(admin, new IOutboxHandler[] { cap }, NullLogger<OutboxRelay>.Instance, TimeSpan.FromSeconds(1));
        var id = Enqueue(admin, "TestEvtFail", DateTime.UtcNow.AddMinutes(-1).ToString("o"));
        await relay.ProcessOnceAsync();
        var s = State(admin, id);
        Assert.False(s.processed); Assert.Equal(1, s.attempts); Assert.Equal("boom", s.err); Assert.True(s.avail > DateTime.UtcNow);
        await relay.ProcessOnceAsync();                       // chưa đến hạn thử lại → không xử lý lại
        Assert.Equal(1, State(admin, id).attempts);
    }

    private static string Root() { for (var d = new DirectoryInfo(AppContext.BaseDirectory); d is not null; d = d.Parent) if (Directory.Exists(Path.Combine(d.FullName, "mock-data"))) return d.FullName; throw new DirectoryNotFoundException(); }
}
