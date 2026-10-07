using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HUMG.CMS.Infrastructure.Security;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace HUMG.CMS.Tests;

public class OidcTokenTests
{
    private const string Issuer = "https://id.humg.edu.vn";
    private static readonly RsaSecurityKey Key = new(RSA.Create(2048)) { KeyId = "k1" };
    private static readonly OidcOptions Opt = new() { Authority = Issuer, Audiences = new[] { "cms-api" }, RoleClient = "cms-api" };

    private static string Token(Dictionary<string, object>? claims = null, string issuer = Issuer, string audience = "cms-api", SecurityKey? key = null, DateTime? expires = null, string alg = SecurityAlgorithms.RsaSha256)
    {
        var d = new SecurityTokenDescriptor
        {
            Issuer = issuer, Audience = audience, Expires = expires ?? DateTime.UtcNow.AddMinutes(10), NotBefore = (expires ?? DateTime.UtcNow.AddMinutes(10)).AddMinutes(-20), IssuedAt = null,
            SigningCredentials = new SigningCredentials(key ?? Key, alg),
            Claims = claims ?? new Dictionary<string, object>
            {
                ["sub"] = "u-123", ["name"] = "Nguyễn Văn A", ["email"] = "a@humg.edu.vn",
                ["realm_access"] = new Dictionary<string, object> { ["roles"] = new[] { "lecturer", "staff" } },
                ["resource_access"] = new Dictionary<string, object> { ["cms-api"] = new Dictionary<string, object> { ["roles"] = new[] { "cms.editor" } }, ["other"] = new Dictionary<string, object> { ["roles"] = new[] { "cms.admin" } } },
                ["tenants"] = new[] { "humg", "cntt" }, ["units"] = new[] { "CNTT" }, ["staff_code"] = "GV0001",
            },
        };
        return new JsonWebTokenHandler().CreateToken(d);
    }
    private static OidcTokenService Svc() => new(Opt, new SecurityKey[] { Key });

    [Fact]
    public void Token_hop_le_duoc_anh_xa_claim_va_role_thanh_quyen_chuc_nang()
    {
        var u = Svc().Read("Bearer " + Token())!;
        Assert.Equal("u-123", u.Sub); Assert.Equal("Nguyễn Văn A", u.Name); Assert.Equal("GV0001", u.StaffCode);
        Assert.Contains("cms.editor", u.Roles); Assert.Contains("lecturer", u.Roles);
        Assert.DoesNotContain("cms.admin", u.Roles);                  // client role của app KHÁC không được tính
        Assert.Contains("news.publish", u.Perms); Assert.Equal(new[] { "humg", "cntt" }, u.Tenants); Assert.Equal(new[] { "CNTT" }, u.Units);
    }

    [Fact] public void Sai_audience_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(audience: "api-khac")));
    [Fact] public void Sai_issuer_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(issuer: "https://evil.example")));
    [Fact] public void Het_han_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(expires: DateTime.UtcNow.AddMinutes(-10))));
    [Fact] public void Ky_bang_khoa_la_bi_tu_choi() => Assert.Null(Svc().Read("Bearer " + Token(key: new RsaSecurityKey(RSA.Create(2048)) { KeyId = "k1" })));
    [Fact] public void Token_bi_sua_payload_bi_tu_choi()
    {
        var p = Token().Split('.'); var payload = Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(p[1])).Replace("u-123", "u-999");
        Assert.Null(Svc().Read($"Bearer {p[0]}.{Base64UrlEncoder.Encode(payload)}.{p[2]}"));
    }
    [Fact] public void Token_HS256_do_mock_phat_hanh_khong_duoc_chap_nhan_o_che_do_oidc()
    {
        var hs = new Hs256TokenService("dev-only-change-me", "8h");
        Assert.Null(Svc().Read("Bearer " + hs.Issue(new Dictionary<string, object?> { ["sub"] = "x", ["roles"] = new[] { "cms.admin" } })));
    }
    [Fact] public void Khong_co_Bearer_hoac_rac_thi_null() { Assert.Null(Svc().Read(null)); Assert.Null(Svc().Read("Bearer rac")); Assert.Null(Svc().Read(Token())); }
    [Fact] public void Che_do_oidc_khong_tu_phat_hanh_token() { Assert.False(Svc().CanIssue); Assert.Throws<NotSupportedException>(() => Svc().Issue(new Dictionary<string, object?>())); }

    [Fact]
    public void Lay_khoa_ky_qua_discovery_cua_Identity_Server()
    {
        var jwks = JsonSerializer.Serialize(new { keys = new[] { JsonWebKeyConverter.ConvertFromRSASecurityKey(new RsaSecurityKey(Key.Rsa) { KeyId = "k1" }) } });
        var port = new Random().Next(20000, 40000); var url = $"http://127.0.0.1:{port}/";
        using var http = new HttpListener(); http.Prefixes.Add(url); http.Start();
        var server = Task.Run(async () =>
        {
            for (var i = 0; i < 2; i++)
            {
                var ctx = await http.GetContextAsync();
                var body = ctx.Request.Url!.AbsolutePath.EndsWith("openid-configuration") ? JsonSerializer.Serialize(new { issuer = Issuer, jwks_uri = url + "jwks" }) : jwks;
                var bytes = Encoding.UTF8.GetBytes(body); ctx.Response.ContentType = "application/json"; await ctx.Response.OutputStream.WriteAsync(bytes); ctx.Response.Close();
            }
        });
        var svc = new OidcTokenService(new OidcOptions { Authority = url.TrimEnd('/'), Audiences = new[] { "cms-api" }, RequireHttpsMetadata = false });
        // issuer trong token phải khớp Authority đã cấu hình
        var token = Token(issuer: url.TrimEnd('/'));
        Assert.Equal("u-123", svc.Read("Bearer " + token)?.Sub);
        Assert.True(server.Wait(5000));
    }
}
