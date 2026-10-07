using System.Security.Cryptography;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Auth;
using HUMG.CMS.Infrastructure.Persistence;
using HUMG.CMS.Infrastructure.Security;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using Xunit;

namespace HUMG.CMS.Tests;

/// <summary>
/// Microsoft Entra ID (tenant c852d62b-…, app SPA 5a7cce06-…): FE đăng nhập Authorization Code + PKCE rồi gửi <b>id_token</b> làm Bearer
/// (khi chưa đặt NEXT_PUBLIC_SSO_API_SCOPE) — API kiểm tra chữ ký (JWKS của tenant), issuer v2/v1, audience, rồi ghép với danh bạ CMS.
/// </summary>
public class EntraTokenTests
{
    private const string Tenant = "c852d62b-3032-4cdc-96ab-30e4368fabd7";
    private const string Client = "5a7cce06-4b5c-4612-b1fa-0ef7f0702a27";
    private static readonly RsaSecurityKey Key = new(RSA.Create(2048)) { KeyId = "entra-k1" };
    private static OidcOptions Opt() { var o = OidcOptions.ForEntra(Tenant, Client); o.GroupRoles = OidcOptions.ParseGroupRoles("11111111-aaaa=cms.admin;22222222-bbbb=cms.editor,staff"); return o; }
    private static OidcTokenService Svc() => new(Opt(), new SecurityKey[] { Key });

    private static string Token(string issuer = $"https://login.microsoftonline.com/{Tenant}/v2.0", string audience = Client, Dictionary<string, object>? extra = null, SecurityKey? key = null)
    {
        var claims = new Dictionary<string, object>
        {
            ["sub"] = "pairwise-sub-xyz", ["oid"] = "f0f0f0f0-1111-2222-3333-444455556666", ["tid"] = Tenant, ["ver"] = "2.0", ["name"] = "Nguyễn Thị Hoa",
            ["preferred_username"] = "NTHoa@humg.edu.vn", ["nonce"] = "n",
        };
        if (extra is not null) foreach (var kv in extra) claims[kv.Key] = kv.Value;
        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = issuer, Audience = audience, Expires = DateTime.UtcNow.AddHours(1), NotBefore = DateTime.UtcNow.AddMinutes(-1), Claims = claims,
            SigningCredentials = new SigningCredentials(key ?? Key, SecurityAlgorithms.RsaSha256),
        });
    }

    [Fact]
    public void Id_token_cua_Entra_duoc_chap_nhan_dinh_danh_theo_oid_va_email_chuan_hoa()
    {
        var u = Svc().Read("Bearer " + Token())!;
        Assert.Equal("f0f0f0f0-1111-2222-3333-444455556666", u.Sub);       // oid ổn định, không dùng sub theo từng ứng dụng
        Assert.Equal("nthoa@humg.edu.vn", u.Email); Assert.Equal("Nguyễn Thị Hoa", u.Name);
        Assert.Empty(u.Roles);                                              // chưa gán app role / nhóm → chưa có quyền CMS từ token
    }

    [Fact] public void Access_token_cho_API_aud_api_client_hop_le() => Assert.NotNull(Svc().Read("Bearer " + Token(audience: $"api://{Client}")));
    [Fact] public void Access_token_v1_co_issuer_sts_windows_net_hop_le() => Assert.NotNull(Svc().Read("Bearer " + Token(issuer: $"https://sts.windows.net/{Tenant}/", audience: $"api://{Client}")));
    [Fact] public void Token_cua_tenant_khac_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(issuer: "https://login.microsoftonline.com/00000000-0000-0000-0000-000000000000/v2.0")));
    [Fact] public void Token_cua_ung_dung_khac_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(audience: "99999999-9999-9999-9999-999999999999")));
    [Fact] public void Token_ky_bang_khoa_khong_thuoc_JWKS_cua_tenant_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(key: new RsaSecurityKey(RSA.Create(2048)) { KeyId = "entra-k1" })));

    [Fact]
    public void App_role_va_nhom_Entra_thanh_role_CMS()
    {
        var u = Svc().Read("Bearer " + Token(extra: new() { ["roles"] = new[] { "cms.author" }, ["groups"] = new[] { "22222222-BBBB", "ngoai-bang" } }))!;
        Assert.Contains("cms.author", u.Roles); Assert.Contains("cms.editor", u.Roles); Assert.Contains("staff", u.Roles);
        Assert.DoesNotContain("cms.admin", u.Roles);
        Assert.Contains("news.publish", u.Perms);
    }

    [Fact] public void Che_do_Entra_khong_tu_phat_hanh_va_can_danh_ba() { var s = Svc(); Assert.False(s.CanIssue); Assert.True(s.ResolvesFromDirectory); }

    [Fact]
    public void ParseGroupRoles_doc_cau_hinh_bien_moi_truong()
    {
        var m = OidcOptions.ParseGroupRoles(" g1 = cms.admin ; g2=cms.editor, staff ;;bad");
        Assert.Equal(new[] { "cms.admin" }, m["g1"]); Assert.Equal(new[] { "cms.editor", "staff" }, m["G2"]); Assert.Equal(2, m.Count);
    }

    /// <summary>Tải discovery + JWKS THẬT của tenant HUMG (cần Internet; bật bằng TEST_ENTRA_LIVE=1): chứng minh cấu hình tenant/issuer và việc lấy khóa ký hoạt động.</summary>
    [SkippableFact]
    public void Discovery_va_JWKS_that_cua_tenant_HUMG()
    {
        if (Environment.GetEnvironmentVariable("TEST_ENTRA_LIVE") != "1") return;
        var svc = new OidcTokenService(Opt());
        Assert.Null(svc.Read("Bearer " + Token()));                       // chữ ký của khóa cục bộ KHÔNG có trong JWKS thật → từ chối (và việc tải JWKS không ném lỗi)
    }
}

[Collection("postgres")]
public class IdentityResolverTests
{
    private static readonly string? AppUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_URL");
    private static readonly string? AdminUrl = Environment.GetEnvironmentVariable("TEST_DATABASE_ADMIN_URL");

    /// <summary>Mở/đóng store trong từng lần gọi (transaction đọc không được để treo — sẽ chặn DDL của các test khác).</summary>
    private static HUMG.CMS.Domain.AccessControl.UserPrincipal? Resolve(HUMG.CMS.Domain.AccessControl.UserPrincipal token, params string[] bootstrapAdmins)
    {
        new PostgresDataMaintenance(NpgsqlDataSource.Create(AdminUrl!), new HUMG.CMS.Infrastructure.Storage.FileMockData(MockDir()), true).EnsureReady();
        using var store = new PostgresDocumentStore(NpgsqlDataSource.Create(AppUrl!), new RequestContext());
        return new IdentityResolver(store, new IdentityOptions { BootstrapAdmins = bootstrapAdmins.ToHashSet() }).Resolve(token);
    }
    private static string MockDir() { for (var d = new DirectoryInfo(AppContext.BaseDirectory); d is not null; d = d.Parent) if (Directory.Exists(Path.Combine(d.FullName, "mock-data"))) return Path.Combine(d.FullName, "mock-data"); throw new DirectoryNotFoundException(); }
    private static HUMG.CMS.Domain.AccessControl.UserPrincipal Tok(string sub, string? email, params string[] roles) =>
        new(sub, "Tên từ token", email, null, roles, HUMG.CMS.Domain.AccessControl.RoleCatalog.PermissionsOf(roles), new[] { "humg" }, Array.Empty<string>(), null, null);

    [SkippableFact]
    public void Nguoi_dung_Entra_duoc_ghep_voi_danh_ba_theo_email()
    {
        if (AppUrl is null || AdminUrl is null) return;
        var u = Resolve(Tok("oid-123", "nthoa@humg.edu.vn"))!;
        Assert.Equal("u-nthoa", u.Sub);                           // sub của danh bạ, khớp với grants và dữ liệu đã có
        Assert.Contains("cms.editor", u.Roles); Assert.Contains("P-TT", u.Units); Assert.Equal("Tên từ token", u.Name);
    }

    [SkippableFact]
    public void Role_cua_token_va_danh_ba_duoc_hop_nhat()
    {
        if (AppUrl is null || AdminUrl is null) return;
        var u = Resolve(Tok("oid-1", "giangvien@humg.edu.vn", "cms.viewer"))!;
        Assert.Contains("cms.viewer", u.Roles); Assert.Contains("lecturer", u.Roles); Assert.Equal("GV0001", u.StaffCode);
    }

    [SkippableFact]
    public void Nguoi_ngoai_danh_ba_giu_nguyen_quyen_tu_token()
    {
        if (AppUrl is null || AdminUrl is null) return;
        var t = Tok("oid-ngoai", "la@example.com", "student");
        var u = Resolve(t)!;
        Assert.Equal("oid-ngoai", u.Sub); Assert.Equal(new[] { "student" }, u.Roles); Assert.DoesNotContain("cms.access", u.Perms);
    }

    [SkippableFact]
    public void Quan_tri_vien_dau_tien_theo_email_trong_CMS_BOOTSTRAP_ADMINS()
    {
        if (AppUrl is null || AdminUrl is null) return;
        var u = Resolve(Tok("oid-moi", "Admin.Moi@HUMG.edu.vn"), "admin.moi@humg.edu.vn")!;     // chưa có trong danh bạ
        Assert.Contains("cms.admin", u.Roles); Assert.Contains("cms.*", u.Perms);
        var other = Resolve(Tok("oid-khac", "nguoi.khac@humg.edu.vn"), "admin.moi@humg.edu.vn")!;  // email khác → không được cấp
        Assert.DoesNotContain("cms.admin", other.Roles);
    }
}
