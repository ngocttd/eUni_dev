using System.Text.Json;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Api.Http;

public static class Middleware
{
    private static async Task WriteError(HttpContext http, int status, string message, IReadOnlyDictionary<string, object?>? extra = null)
    {
        if (http.Response.HasStarted) return;
        http.Response.Clear();
        http.Response.StatusCode = status;
        http.Response.ContentType = "application/json; charset=utf-8";
        var o = new Dictionary<string, object?> { ["message"] = message };
        if (extra is not null) foreach (var kv in extra) o[kv.Key] = kv.Value;
        await http.Response.WriteAsync(JsonSerializer.Serialize(o, Doc.Raw));
    }

    /// <summary>Lỗi nghiệp vụ → <c>{ message, ...extra }</c> đúng mã HTTP; lỗi không lường trước → 500.</summary>
    public static IApplicationBuilder UseApiErrors(this IApplicationBuilder app, ILogger logger) => app.Use(async (http, next) =>
    {
        try { await next(); }
        catch (HttpError e) { await WriteError(http, e.Status, e.Message, e.Extra); }
        catch (BadHttpRequestException e) { await WriteError(http, e.StatusCode, "Yêu cầu không hợp lệ."); }
        catch (Exception e) when (e is JsonException or InvalidDataException) { await WriteError(http, 400, "Yêu cầu không hợp lệ."); }
        catch (Exception e) { logger.LogError(e, "Lỗi hệ thống"); await WriteError(http, 500, "Lỗi hệ thống."); }
    });

    /// <summary>Route không có / sai phương thức → 404 JSON như mock (ASP.NET mặc định trả 405).</summary>
    public static IApplicationBuilder UseJsonNotFound(this IApplicationBuilder app) => app.Use(async (http, next) =>
    {
        await next();
        if (http.Response.HasStarted) return;
        if (http.Response.StatusCode == 405 || (http.Response.StatusCode == 404 && http.Response.ContentLength is null && http.Response.ContentType is null))
        {
            http.Response.Headers.Remove("Allow");
            await WriteError(http, 404, "Endpoint không tồn tại.");
        }
    });

    /// <summary>Một request tại một thời điểm (như mock Node đơn luồng): dữ liệu do role ứng dụng ghi trong một transaction/request.</summary>
    public static IApplicationBuilder UseSerialized(this IApplicationBuilder app) => app.Use(async (http, next) =>
    {
        var gate = http.RequestServices.GetRequiredService<RequestGate>();
        await gate.Semaphore.WaitAsync(http.RequestAborted);
        try { await next(); }
        finally { gate.Semaphore.Release(); }
    });

    /// <summary>Đọc token → <see cref="RequestContext.User"/>; ghi IP/User-Agent/If-Match cho audit và kiểm tra version.</summary>
    public static IApplicationBuilder UseRequestContext(this IApplicationBuilder app) => app.Use(async (http, next) =>
    {
        var ctx = http.RequestServices.GetRequiredService<RequestContext>();
        ctx.User = http.RequestServices.GetRequiredService<ITokenService>().Read(http.Request.Headers.Authorization.FirstOrDefault());
        ctx.Ip = http.Connection.RemoteIpAddress?.ToString();
        ctx.UserAgent = http.Request.Headers.UserAgent.FirstOrDefault();
        ctx.IfMatch = http.Request.Headers.TryGetValue("If-Match", out var im) ? im.FirstOrDefault() : null;
        await next();
    });

    /// <summary>
    /// Tenant của request (docs/design/CMS_DESIGN.md §2.2): header X-Tenant → host (bảng domain) → tenant mặc định. Áp cho mọi route <c>/cms-api</c>.
    /// </summary>
    public static IApplicationBuilder UseTenant(this IApplicationBuilder app) => app.Use(async (http, next) =>
    {
        if (http.Request.Path.StartsWithSegments("/cms-api"))
        {
            var ctx = http.RequestServices.GetRequiredService<RequestContext>();
            var tenants = http.RequestServices.GetRequiredService<TenantService>();
            var host = http.Request.Headers["X-Forwarded-Host"].FirstOrDefault() is { Length: > 0 } fh ? fh : http.Request.Headers.Host.FirstOrDefault();
            var path = http.Request.Path.Value ?? "";
            (ctx.Tenant, ctx.AllTenants) = tenants.Resolve(http.Request.Headers["X-Tenant"].FirstOrDefault(), host, path);
            // Row-Level Security: mặc định chỉ đọc tenant của request; mở rộng có chủ đích cho các use case xuyên trang
            if (ctx.AllTenants) ctx.ReadTenants = ctx.User is { Tenants.Count: > 0 } u ? u.Tenants : new[] { ctx.Tenant };
            else if (path.EndsWith("/api/v1/me/context", StringComparison.OrdinalIgnoreCase) || path.Contains("/api/v1/admin/tenants", StringComparison.OrdinalIgnoreCase))
                ctx.ReadTenants = tenants.All().Select(t => t.Str("id")!).ToList();
        }
        await next();
    });
}

public sealed class RequestGate { public SemaphoreSlim Semaphore { get; } = new(1, 1); }

public static class CommitFilter
{
    /// <summary>
    /// Commit transaction của request NGAY SAU use case thành công (trước khi ghi response); nếu có lỗi thì không commit (rollback khi scope kết thúc).
    /// </summary>
    public static TBuilder WithTransactionPerRequest<TBuilder>(this TBuilder b) where TBuilder : IEndpointConventionBuilder =>
        b.AddEndpointFilter(async (ctx, next) =>
        {
            var result = await next(ctx);
            ctx.HttpContext.RequestServices.GetRequiredService<IDocumentStore>().Flush();
            return result;
        });
}
