using System.Text;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence;
using HUMG.CMS.Infrastructure.Storage;
using Npgsql;
using Xunit;

namespace HUMG.CMS.Tests;

/// <summary>Quy trình upload file + ghi DB phải bù trừ: DB hủy/lỗi → xóa file; lỗi xóa không bị nuốt.</summary>
[Collection("postgres")]
public class StorageCompensationTests
{
    private static readonly string? AppUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_URL");
    private static readonly string? S3Endpoint = Environment.GetEnvironmentVariable("TEST_S3_ENDPOINT");
    private readonly string _tag = "c" + Guid.NewGuid().ToString("N")[..8];

    private PostgresDocumentStore Store() => new(NpgsqlDataSource.Create(AppUrl!), new RequestContext { Tenant = "humg" });
    private JsonObjectFactory F => new();
    private sealed class JsonObjectFactory { public System.Text.Json.Nodes.JsonObject Cat(string t, string slug) => Doc.Obj(("tenantId", "humg"), ("name", slug), ("slug", slug), ("sortOrder", 1)); }

    [SkippableFact]
    public void Commit_thanh_cong_thi_khong_chay_but_tru()
    {
        if (AppUrl is null) return;
        var ran = false;
        using var s = Store();
        s.Insert("categories", F.Cat("humg", _tag + "-ok")); s.OnDiscard(() => { ran = true; return Task.CompletedTask; });
        s.Flush();
        Assert.False(ran);
    }

    [SkippableFact]
    public void Commit_that_bai_thi_chay_but_tru_va_van_nem_loi_goc()
    {
        if (AppUrl is null) return;
        using (var s0 = Store()) { s0.Insert("categories", F.Cat("humg", _tag + "-dup")); s0.Flush(); }
        var ran = false;
        using var s = Store();
        s.Insert("categories", F.Cat("humg", _tag + "-dup"));        // trùng slug → 409 khi commit
        s.OnDiscard(() => { ran = true; return Task.CompletedTask; });
        Assert.Equal(409, Assert.Throws<HttpError>(() => s.Flush()).Status);
        Assert.True(ran);
    }

    [SkippableFact]
    public void Loi_but_tru_khong_bi_nuot()
    {
        if (AppUrl is null) return;
        using var s = Store();
        s.OnDiscard(() => throw new IOException("không xóa được file"));
        var ex = Assert.Throws<AggregateException>(() => s.Discard());
        Assert.Contains("không xóa được file", ex.InnerExceptions.Select(e => e.Message));
    }

    [SkippableFact]
    public async Task S3_upload_roi_huy_transaction_thi_xoa_object()
    {
        if (AppUrl is null || S3Endpoint is null) return;
        using var storage = new S3FileStorage(new S3Options { Endpoint = S3Endpoint, AccessKey = "test", SecretKey = "test", Bucket = "cms-test-" + _tag });
        var f = await storage.SaveAsync(new MemoryStream(Encoding.UTF8.GetBytes("xin chào")), "Ảnh Đẹp.PNG", "humg", "image/png");
        Assert.Matches(@"^humg/\d{4}/\d{2}/[0-9a-f]{32}\.png$", f.Key);          // {tenant}/yyyy/MM/{uuid}.{ext}
        Assert.NotNull(await storage.OpenReadAsync(f.Key));
        using (var s = Store()) { s.OnDiscard(() => storage.DeleteAsync(f.Key)); s.Discard(); }
        Assert.Null(await storage.OpenReadAsync(f.Key));
        await storage.DeleteAsync(f.Key);                                          // xóa lại: coi như đã xóa, không lỗi
    }
}
