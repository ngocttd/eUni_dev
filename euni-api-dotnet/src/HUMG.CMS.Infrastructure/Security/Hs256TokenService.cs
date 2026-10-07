using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Security;

/// <summary>
/// JWT HS256 tự phát hành — đóng vai Identity Server khi dev (token cùng định dạng/khóa với mock Node nên hai bản dùng chung token).
/// Khi nối IdS thật: thay bằng xác thực JwtBearer (issuer + audience <c>cms-api</c>); các use case chỉ cần <see cref="UserPrincipal"/>.
/// </summary>
public sealed class Hs256TokenService : ITokenService
{
    public bool CanIssue => true;
    public bool ResolvesFromDirectory => false;
    private readonly byte[] _key;
    private readonly TimeSpan _ttl;

    public Hs256TokenService(string secret, string expiresIn)
    {
        _key = Encoding.UTF8.GetBytes(secret);
        _ttl = ParseTtl(expiresIn);
    }

    private static TimeSpan ParseTtl(string v)
    {
        v = v.Trim();
        if (double.TryParse(v, out var secs)) return TimeSpan.FromSeconds(secs);
        var unit = v[^1]; var n = double.Parse(v[..^1], System.Globalization.CultureInfo.InvariantCulture);
        return unit switch { 's' => TimeSpan.FromSeconds(n), 'm' => TimeSpan.FromMinutes(n), 'h' => TimeSpan.FromHours(n), 'd' => TimeSpan.FromDays(n), _ => TimeSpan.FromHours(8) };
    }

    private static string B64(byte[] b) => Convert.ToBase64String(b).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    private static byte[] FromB64(string s)
    {
        s = s.Replace('-', '+').Replace('_', '/');
        s = s.PadRight(s.Length + (4 - s.Length % 4) % 4, '=');
        return Convert.FromBase64String(s);
    }
    private byte[] Sign(string data) { using var h = new HMACSHA256(_key); return h.ComputeHash(Encoding.ASCII.GetBytes(data)); }

    public string Issue(IReadOnlyDictionary<string, object?> claims)
    {
        var now = DateTimeOffset.UtcNow;
        var payload = new Dictionary<string, object?>(claims) { ["iat"] = now.ToUnixTimeSeconds(), ["exp"] = (now + _ttl).ToUnixTimeSeconds() };
        var head = B64(Encoding.UTF8.GetBytes("{\"alg\":\"HS256\",\"typ\":\"JWT\"}"));
        var body = B64(JsonSerializer.SerializeToUtf8Bytes(payload));
        return $"{head}.{body}.{B64(Sign($"{head}.{body}"))}";
    }

    public UserPrincipal? Read(string? authorizationHeader)
    {
        if (authorizationHeader is null || !authorizationHeader.StartsWith("Bearer ")) return null;
        try
        {
            var parts = authorizationHeader[7..].Split('.');
            if (parts.Length != 3) return null;
            if (!CryptographicOperations.FixedTimeEquals(Sign($"{parts[0]}.{parts[1]}"), FromB64(parts[2]))) return null;
            var head = JsonNode.Parse(FromB64(parts[0])) as JsonObject;
            if (head?.Str("alg") != "HS256") return null;
            var p = JsonNode.Parse(FromB64(parts[1])) as JsonObject;
            if (p is null) return null;
            if (p.Long("exp") is { } exp && exp <= DateTimeOffset.UtcNow.ToUnixTimeSeconds()) return null;
            if (!Doc.Truthy(p.Get("sub"))) return null;
            return new UserPrincipal(p.Str("sub")!, p.Str("name"), p.Str("email"), p.Str("role"), p.Get("roles").Strings().ToList(), p.Get("perms").Strings().ToList(),
                p.Get("tenants").Strings().ToList(), p.Get("units").Strings().ToList(), p.Str("staff_code"), p.Str("student_code"));
        }
        catch (Exception e) when (e is FormatException or JsonException or ArgumentException) { return null; }
    }
}
