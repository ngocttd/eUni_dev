using System.Text.Json.Nodes;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace HUMG.CMS.Tests;

/// <summary>
/// Kiểm thử trên PostgreSQL thật (bỏ qua nếu không đặt TEST_DATABASE_URL / TEST_DATABASE_ADMIN_URL), dùng đúng role ứng dụng cms_app (NOBYPASSRLS):
/// cô lập tenant bằng RLS, ghi trong một transaction, rollback khi lỗi.
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
        var admin = NpgsqlDataSource.Create(AdminUrl);
        using (var c = admin.OpenConnection()) using (var cmd = new NpgsqlCommand(SchemaSql(), c)) cmd.ExecuteNonQuery();
        _app = NpgsqlDataSource.Create(AppUrl);
    }

    private static string SchemaSql() => File.ReadAllText(Path.Combine(FindRoot(), "database", "cms-api", "schema.sql"));
    private static string FindRoot() { for (var d = new DirectoryInfo(AppContext.BaseDirectory); d is not null; d = d.Parent) if (File.Exists(Path.Combine(d.FullName, "HUMG.CMS.sln"))) return d.FullName; throw new DirectoryNotFoundException(); }

    private PostgresDocumentStore Store(string tenant, params string[] read) =>
        new(_app!, new RequestContext { Tenant = tenant, ReadTenants = read.Length > 0 ? read : null });


    [SkippableFact]
    public void Tenant_khac_khong_doc_duoc_du_lieu()
    {
        if (_app is null) return;
        using (var s = Store("humg")) { s.Insert("rls_test_" + _tag, Doc.Obj(("tenantId", "humg"), ("title", "bí mật"))); s.Flush(); }
        using (var s = Store("cntt")) Assert.Empty(s.Rows("rls_test_" + _tag));
        using (var s = Store("humg")) Assert.Single(s.Rows("rls_test_" + _tag));
        using (var s = Store("cntt", "cntt", "humg")) Assert.Single(s.Rows("rls_test_" + _tag)); // đọc đa trang có chủ đích
    }

    [SkippableFact]
    public void Khong_ghi_duoc_ban_ghi_cua_tenant_khac_khi_context_la_tenant_nay()
    {
        if (_app is null) return;
        using var c = _app.OpenConnection(); using var tx = c.BeginTransaction();
        new NpgsqlCommand("SELECT set_config('app.tenant_ids','humg',true), set_config('app.tenant_id','humg',true)", c, tx).ExecuteNonQuery();
        var ex = Assert.Throws<PostgresException>(() =>
            new NpgsqlCommand($"INSERT INTO cms_api.tenant_documents(collection,key,tenant_id,doc) VALUES ('x{_tag}','1','cntt','{{}}')", c, tx).ExecuteNonQuery());
        Assert.Equal("42501", ex.SqlState); // insufficient_privilege (RLS WITH CHECK)
    }

    [SkippableFact]
    public void Khong_co_ngu_canh_tenant_thi_khong_thay_dong_nao()
    {
        if (_app is null) return;
        using (var s = Store("humg")) { s.Insert("rls_ctx_" + _tag, Doc.Obj(("tenantId", "humg"))); s.Flush(); }
        using var c = _app.OpenConnection();
        using var cmd = new NpgsqlCommand($"SELECT count(*) FROM cms_api.tenant_documents WHERE collection = 'rls_ctx_{_tag}'", c);
        Assert.Equal(0L, cmd.ExecuteScalar());
    }

    [SkippableFact]
    public void Loi_giua_chung_thi_rollback_toan_bo()
    {
        if (_app is null) return;
        var col = "rls_tx_" + _tag;
        using (var s = Store("humg"))
        {
            s.Insert(col, Doc.Obj(("tenantId", "humg"), ("n", 1)));
            s.Discard(); // mô phỏng use case ném lỗi: không Flush
        }
        using (var s = Store("humg")) Assert.Empty(s.Rows(col));
    }

    [SkippableFact]
    public void Chi_ghi_nhung_ban_ghi_da_thay_doi_va_giu_dung_gia_tri()
    {
        if (_app is null) return;
        var col = "rls_upd_" + _tag; long id;
        using (var s = Store("humg")) { id = s.Insert(col, Doc.Obj(("tenantId", "humg"), ("title", "a"), ("version", 1))).Id(); s.Flush(); }
        using (var s = Store("humg")) { s.Update(col, id, Doc.Obj(("title", "b"), ("version", 2))); s.Flush(); }
        using (var s = Store("humg")) { var r = Assert.Single(s.Rows(col)); Assert.Equal("b", r.Str("title")); Assert.Equal(2, r.Long("version")); }
        using (var s = Store("humg")) { Assert.True(s.Remove(col, id)); s.Flush(); }
        using (var s = Store("humg")) Assert.Empty(s.Rows(col));
    }

    public void Dispose()
    {
        if (_app is null || AdminUrl is null) return;
        using var admin = NpgsqlDataSource.Create(AdminUrl); using var c = admin.OpenConnection();
        using var cmd = new NpgsqlCommand("DELETE FROM cms_api.tenant_documents WHERE collection LIKE 'rls\\_%\\_' || @t; DELETE FROM cms_api.sequences WHERE collection LIKE 'rls\\_%\\_' || @t", c);
        cmd.Parameters.AddWithValue("t", _tag); cmd.ExecuteNonQuery();
        _app.Dispose();
    }
}
