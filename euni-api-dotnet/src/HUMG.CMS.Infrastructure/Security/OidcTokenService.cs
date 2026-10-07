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
    /// <summary>Issuer của nhà cung cấp OIDC: khóa công khai lấy qua <c>{Authority}/.well-known/openid-configuration</c>. Entra ID: <c>https://login.microsoftonline.com/{tenant}/v2.0</c>.</summary>
    public string Authority { get; set; } = "";
    /// <summary>Issuer hợp lệ bổ sung (Entra: access token v1 có issuer <c>https://sts.windows.net/{tenant}/</c>).</summary>
    public string[] ExtraIssuers { get; set; } = Array.Empty<string>();
    /// <summary>Audience hợp lệ. Entra: id_token có aud = client id; access token cho API có aud = <c>api://{client id}</c> (hoặc client id).</summary>
    public string[] Audiences { get; set; } = { "cms-api" };
    /// <summary>Client id để đọc client role trong <c>resource_access.{client}.roles</c> (Keycloak).</summary>
    public string RoleClient { get; set; } = "cms-api";
    /// <summary>Entra: claim <c>groups</c> là object id của nhóm → role (cms.admin, staff…). Không đặt = bỏ qua nhóm.</summary>
    public Dictionary<string, string[]> GroupRoles { get; set; } = new();
    public bool RequireHttpsMetadata { get; set; } = true;
    public TimeSpan ClockSkew { get; set; } = TimeSpan.FromMinutes(1);

    /// <summary>Cấu hình sẵn cho Microsoft Entra ID (tenant + app SPA đăng ký ở Azure).</summary>
    public static OidcOptions ForEntra(string tenantId, string clientId, string[]? audiences = null) => new()
    {
        Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0",
        ExtraIssuers = new[] { $"https://sts.windows.net/{tenantId}/" },
        Audiences = audiences is { Length: > 0 } ? audiences : new[] { clientId, $"api://{clientId}" },
    };

    /// <summary>"groupId=cms.admin;groupId2=cms.editor,staff" → bảng nhóm → role.</summary>
    public static Dictionary<string, string[]> ParseGroupRoles(string? v) =>
        (v ?? "").Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(x => x.Split('=', 2)).Where(p => p.Length == 2)
            .ToDictionary(p => p[0].Trim(), p => p[1].Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries), StringComparer.OrdinalIgnoreCase);
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
    /// <summary>Token ngoài không mang đủ role/đơn vị/tenant của CMS → quyền chi tiết lấy từ danh bạ (khớp theo sub hoặc email).</summary>
    public bool ResolvesFromDirectory => true;
    public string Issue(IReadOnlyDictionary<string, object?> claims) => throw new NotSupportedException("Token do Identity Server phát hành.");

    public UserPrincipal? Read(string? authorizationHeader)
    {
        if (authorizationHeader is null || !authorizationHeader.StartsWith("Bearer ")) return null;
        try
        {
            var p = new TokenValidationParameters
            {
                ValidIssuers = new[] { _o.Authority.TrimEnd('/') }.Concat(_o.ExtraIssuers).ToArray(), ValidateIssuer = true,
                ValidAudiences = _o.Audiences, ValidateAudience = true,
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
        // Entra: `sub` chỉ duy nhất theo từng ứng dụng; `oid` là định danh ổn định của người dùng trong tenant
        var sub = Doc.Truthy(c?.Get("oid")) ? c!.Str("oid") : c?.Str("sub");
        if (c is null || string.IsNullOrEmpty(sub)) return null;
        var roles = Many(c.Get("roles")).Concat(Many((c.Get("realm_access") as JsonObject)?.Get("roles")))
            .Concat(Many(((c.Get("resource_access") as JsonObject)?.Get(_o.RoleClient) as JsonObject)?.Get("roles")))
            .Concat(Many(c.Get("groups")).SelectMany(g => _o.GroupRoles.TryGetValue(g, out var r) ? r : Array.Empty<string>())).Distinct().ToList();
        var tenants = Many(c.Get("tenants")).ToList(); if (tenants.Count == 0) tenants.Add("humg");
        var email = (c.Str("email") ?? c.Str("preferred_username") ?? c.Str("upn"))?.Trim().ToLowerInvariant();
        return new UserPrincipal(sub, c.Str("name") ?? c.Str("preferred_username"), email, null, roles, RoleCatalog.PermissionsOf(roles), tenants,
            Many(c.Get("units")).ToList(), c.Str("staff_code"), c.Str("student_code"));
    }
}
