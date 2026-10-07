using HUMG.CMS.Application.Features.AccessControl;

namespace HUMG.CMS.Api.Http;

/// <summary>Kiểm tra token + quyền chức năng + trang đang quản trị trước khi vào use case (quyền mức bản ghi kiểm tra trong use case).</summary>
public static class AuthFilters
{
    public static RouteHandlerBuilder RequireCms(this RouteHandlerBuilder b, string? perm = null) =>
        b.AddEndpointFilter(async (ctx, next) => { ctx.HttpContext.RequestServices.GetRequiredService<AuthorizationService>().RequireCms(perm); return await next(ctx); });

    public static RouteHandlerBuilder RequireUser(this RouteHandlerBuilder b) =>
        b.AddEndpointFilter(async (ctx, next) => { ctx.HttpContext.RequestServices.GetRequiredService<AuthorizationService>().RequireUser(); return await next(ctx); });

    public static RouteHandlerBuilder RequireSuper(this RouteHandlerBuilder b) =>
        b.AddEndpointFilter(async (ctx, next) => { ctx.HttpContext.RequestServices.GetRequiredService<AuthorizationService>().RequireSuper(); return await next(ctx); });
}
