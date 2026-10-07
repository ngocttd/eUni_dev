using System.Text.Json;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace HUMG.CMS.Infrastructure.Security;

public sealed class OidcOptions
{
    /// <summary>Issuer của Identity Server (Keycloak/Duende…): khóa công khai lấy qua <c>{Authority}/.well-known/openid-configuration</c>.</summary>
    public string Authority { get; set; } = "";
    /// <summary>Audience của API (access token <c>aud=cms-api</c>).</summary>
    public string Audience { get; set; } = "cms-api";
    /// <summary>Client id để đọc client role trong <c>resource_access.{client}.roles</c> (Keycloak).</summary>
    public string RoleClient { get; set; } = "cms-api";
    public bool RequireHttpsMetadata { get; set; } = true;
    public TimeSpan ClockSkew { get; set; } = TimeSpan.FromMinutes(1);
}

/// <summary>
/// Xác thực access token do Identity Server thật phát hành (JWT, chữ ký bất đối xứng, kiểm tra issuer + audience + hạn dùng) — thay cho
/// <see cref="Hs256TokenService"/> khi <c>AUTH_MODE=oidc</c>. Không đổi cấu hình SSO/gateway: chỉ ĐỌC claim.
/// Role (realm + client) → quyền chức năng của CMS theo bảng tĩnh <see cref="RoleCatalog"/>; tenant/đơn vị theo claim <c>tenants</c>, <c>units</c>.
/// </summary>
public sealed class OidcTokenService : ITokenService
{
    private readonly OidcOptions _o;
    private readonly Func<IEnumerable<SecurityKey>> _keys;
    private readonly JsonWebTokenHandler _handler = new();

    /// <summary>Lấy khóa ký từ metadata của IdS (có cache + tự làm mới khi đổi khóa).</summary>
    public OidcTokenService(OidcOptions o)
    {
        _o = o;
        var cm = new ConfigurationManager<OpenIdConnectConfiguration>($"{o.Authority.TrimEnd('/')}/.well-known/openid-configuration",
            new OpenIdConnectConfigurationRetriever(), new HttpDocumentRetriever { RequireHttps = o.RequireHttpsMetadata });
        _keys = () => cm.GetConfigurationAsync(CancellationToken.None).GetAwaiter().GetResult().SigningKeys;
    }

    /// <summary>Dùng bộ khóa cho trước (kiểm thử / môi trường không có discovery).</summary>
    public OidcTokenService(OidcOptions o, IEnumerable<SecurityKey> keys) { _o = o; _keys = () => keys; }

    public bool CanIssue => false;
    public string Issue(IReadOnlyDictionary<string, object?> claims) => throw new NotSupportedException("Token do Identity Server phát hành.");

    public UserPrincipal? Read(string? authorizationHeader)
    {
        if (authorizationHeader is null || !authorizationHeader.StartsWith("Bearer ")) return null;
        try
        {
            var p = new TokenValidationParameters
            {
                ValidIssuer = _o.Authority.TrimEnd('/'), ValidateIssuer = true,
                ValidAudience = _o.Audience, ValidateAudience = true,
                ValidateLifetime = true, RequireExpirationTime = true, ClockSkew = _o.ClockSkew,
                RequireSignedTokens = true, IssuerSigningKeys = _keys(), ValidateIssuerSigningKey = true,
                ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256, SecurityAlgorithms.RsaSha384, SecurityAlgorithms.RsaSha512, SecurityAlgorithms.EcdsaSha256, SecurityAlgorithms.EcdsaSha384 },
            };
            var r = _handler.ValidateTokenAsync(authorizationHeader[7..], p).GetAwaiter().GetResult();
            if (!r.IsValid) return null;
            return ToPrincipal(JsonNode.Parse(((JsonWebToken)r.SecurityToken).EncodedPayload is { } ? Decode(((JsonWebToken)r.SecurityToken).EncodedPayload) : "{}") as JsonObject);
        }
        catch (Exception e) when (e is SecurityTokenException or ArgumentException or JsonException or InvalidOperationException or HttpRequestException or IOException) { return null; }
    }

    private static string Decode(string b64) => System.Text.Encoding.UTF8.GetString(Base64UrlEncoder.DecodeBytes(b64));

    private IEnumerable<string> Many(JsonNode? n) => n switch
    {
        JsonArray a => a.Select(Doc.AsString).Where(s => !string.IsNullOrEmpty(s)).Select(s => s!),
        JsonValue v when Doc.AsString(v) is { Length: > 0 } s => s.Split(' ', StringSplitOptions.RemoveEmptyEntries),
        _ => Enumerable.Empty<string>(),
    };

    private UserPrincipal? ToPrincipal(JsonObject? c)
    {
        if (c is null || !Doc.Truthy(c.Get("sub"))) return null;
        var roles = Many(c.Get("roles")).Concat(Many((c.Get("realm_access") as JsonObject)?.Get("roles")))
            .Concat(Many(((c.Get("resource_access") as JsonObject)?.Get(_o.RoleClient) as JsonObject)?.Get("roles"))).Distinct().ToList();
        var tenants = Many(c.Get("tenants")).ToList(); if (tenants.Count == 0) tenants.Add("humg");
        return new UserPrincipal(c.Str("sub")!, c.Str("name") ?? c.Str("preferred_username"), c.Str("email"), null, roles, RoleCatalog.PermissionsOf(roles), tenants,
            Many(c.Get("units")).ToList(), c.Str("staff_code"), c.Str("student_code"));
    }
}
