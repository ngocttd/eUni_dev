using System.Text.Json.Nodes;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace HUMG.CMS.Tests;

/// <summary>
/// Kiểm thử trên PostgreSQL thật (bỏ qua nếu không đặt TEST_DATABASE_URL / TEST_DATABASE_ADMIN_URL), dùng đúng role ứng dụng cms_app (NOBYPASSRLS)
/// trên lược đồ quan hệ v2: ánh xạ tài liệu ↔ bảng, cô lập tenant bằng RLS, ghi trong một transaction, rollback + bù trừ khi lỗi.
/// </summary>
[Collection("postgres")]
public class PostgresRlsTests : IDisposable
{
    private static readonly string? AppUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_URL");
    private static readonly string? AdminUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_ADMIN_URL");
    private readonly NpgsqlDataSource? _app;
    private readonly string _tag = "t" + Guid.NewGuid().ToString("N")[..8];

    public PostgresRlsTests()
    {
        if (AppUrl is null || AdminUrl is null) return;
        // chạy bằng cms_admin: áp lược đồ + nạp dữ liệu mẫu (cần có tenant humg/cntt)
        new PostgresDataMaintenance(NpgsqlDataSource.Create(AdminUrl), new HUMG.CMS.Infrastructure.Storage.FileMockData(MockDir()), true).EnsureReady();
        _app = NpgsqlDataSource.Create(AppUrl);
    }

    private static string MockDir() { for (var d = new DirectoryInfo(AppContext.BaseDirectory); d is not null; d = d.Parent) if (Directory.Exists(Path.Combine(d.FullName, "mock-data"))) return Path.Combine(d.FullName, "mock-data"); throw new DirectoryNotFoundException(); }

    private PostgresDocumentStore Store(string tenant, params string[] read) => new(_app!, new RequestContext { Tenant = tenant, ReadTenants = read.Length > 0 ? read : null });
    private JsonObject Cat(string tenant, string name) => Doc.Obj(("tenantId", tenant), ("name", name), ("slug", $"{_tag}-{TextUtil.Slugify(name)}"), ("sortOrder", 1), ("isActive", true));

    [SkippableFact]
    public void Tenant_khac_khong_doc_duoc_du_lieu()
    {
        if (_app is null) return;
        using (var s = Store("humg")) { s.Insert("categories", Cat("humg", "Bí mật " + _tag)); s.Flush(); }
        using (var s = Store("cntt")) Assert.DoesNotContain(s.Rows("categories"), c => c.Str("slug")!.StartsWith(_tag));
        using (var s = Store("humg")) Assert.Contains(s.Rows("categories"), c => c.Str("slug")!.StartsWith(_tag));
        using (var s = Store("cntt", "cntt", "humg")) Assert.Contains(s.Rows("categories"), c => c.Str("slug")!.StartsWith(_tag)); // đọc đa trang có chủ đích
    }

    [SkippableFact]
    public void Khong_ghi_duoc_vao_tenant_khac_khi_context_la_tenant_nay()
    {
        if (_app is null) return;
        using var c = _app.OpenConnection(); using var tx = c.BeginTransaction();
        new NpgsqlCommand("SELECT set_config('app.tenant_ids','humg,cntt',true), set_config('app.tenant_id','humg',true)", c, tx).ExecuteNonQuery();
        var ex = Assert.Throws<PostgresException>(() => new NpgsqlCommand("INSERT INTO cms.categories (tenant_id) VALUES ('cntt')", c, tx).ExecuteNonQuery());
        Assert.Equal("42501", ex.SqlState); // insufficient_privilege (RLS WITH CHECK)
    }

    [SkippableFact]
    public void Bang_con_khong_lo_du_lieu_giua_cac_tenant()
    {
        if (_app is null) return;
        using var c = _app.OpenConnection(); using var tx = c.BeginTransaction();
        new NpgsqlCommand("SELECT set_config('app.tenant_ids','cntt',true), set_config('app.tenant_id','cntt',true)", c, tx).ExecuteNonQuery();
        using var raw = new NpgsqlCommand("SELECT count(*) FROM cms.announcement_targets", c, tx);
        using var own = new NpgsqlCommand("SELECT count(*) FROM cms.announcement_targets t WHERE EXISTS (SELECT 1 FROM cms.announcements a WHERE a.id = t.announcement_id AND a.tenant_id = 'cntt')", c, tx);
        Assert.Equal((long)own.ExecuteScalar()!, (long)raw.ExecuteScalar()!);
    }

    [SkippableFact]
    public void Khong_co_ngu_canh_tenant_thi_khong_thay_dong_nao()
    {
        if (_app is null) return;
        using var c = _app.OpenConnection();
        using var cmd = new NpgsqlCommand("SELECT count(*) FROM cms.news", c);
        Assert.Equal(0L, cmd.ExecuteScalar());
    }

    [SkippableFact]
    public void Loi_giua_chung_thi_rollback_toan_bo_va_chay_but_tru()
    {
        if (_app is null) return;
        var compensated = false;
        using (var s = Store("humg"))
        {
            s.Insert("categories", Cat("humg", "Hủy " + _tag));
            s.OnDiscard(() => { compensated = true; return Task.CompletedTask; });
            s.Discard(); // mô phỏng use case ném lỗi: không Flush
        }
        Assert.True(compensated);
        using (var s = Store("humg")) Assert.DoesNotContain(s.Rows("categories"), c => c.Str("slug") == $"{_tag}-huy-{_tag}");
    }

    [SkippableFact]
    public void Loi_rang_buoc_khi_commit_la_409_va_khong_ghi_gi()
    {
        if (_app is null) return;
        var slugged = Cat("humg", "Trùng " + _tag);
        using (var s = Store("humg")) { s.Insert("categories", slugged); s.Flush(); }
        using var s2 = Store("humg");
        s2.Insert("categories", slugged);   // trùng (tenant, lang, slug)
        var ex = Assert.Throws<HttpError>(() => s2.Flush());
        Assert.Equal(409, ex.Status);
    }

    [SkippableFact]
    public void Ban_dich_va_bang_con_duoc_luu_trong_cung_mot_ban_ghi()
    {
        if (_app is null) return;
        long id;
        using (var s = Store("humg"))
        {
            var n = s.Insert("contents", Doc.Obj(("tenantId", "humg"), ("title", "Tin " + _tag), ("slug", "tin-" + _tag), ("contentBody", "<p>a</p>"), ("status", "draft"), ("authorSub", "u-test"), ("createdBy", "u-test"),
                ("version", 1), ("translations", Doc.Obj(("en", Doc.Obj(("title", "News"), ("status", "done"))))), ("attachments", new JsonArray(Doc.Obj(("title", "t.pdf"), ("meta", "1MB"), ("url", null))))));
            id = n.Id(); s.Flush();
        }
        using (var s = Store("humg"))
        {
            var n = Assert.Single(s.Rows("contents"), c => c.Id() == id);
            Assert.Equal("Tin " + _tag, n.Str("title")); Assert.Equal("News", n.Get("translations")!["en"]!["title"]!.GetValue<string>()); Assert.Equal("t.pdf", n.Get("attachments")![0]!["title"]!.GetValue<string>());
        }
        using (var s = Store("humg")) { Assert.True(s.Remove("contents", id)); s.Flush(); }
        using (var s = Store("humg")) Assert.DoesNotContain(s.Rows("contents"), c => c.Id() == id);
    }

    public void Dispose()
    {
        if (_app is null || AdminUrl is null) return;
        using var admin = NpgsqlDataSource.Create(AdminUrl); using var c = admin.OpenConnection();
        using var cmd = new NpgsqlCommand("DELETE FROM cms.categories WHERE id IN (SELECT category_id FROM cms.category_translations WHERE slug LIKE @p); DELETE FROM cms.news WHERE author_sub = 'u-test'", c);
        cmd.Parameters.AddWithValue("p", _tag + "%"); cmd.ExecuteNonQuery();
        _app.Dispose();
    }
}
