using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Auth;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>auth-api — đóng vai Identity Server khi dev: login / me / refresh / logout.</summary>
public static class AuthEndpoints
{
    public static void MapAuthApi(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/auth-api/api/v1/auth").WithTransactionPerRequest();
        g.MapPost("/login", async (HttpContext http, AuthService s) => R.Ok(s.Login(await http.BodyAsync())));
        g.MapGet("/me", (RequestContext ctx, AuthService s) => R.Ok(s.Me(ctx.User)));
        g.MapPost("/refresh", (RequestContext ctx, AuthService s) => R.Ok(s.Refresh(ctx.User)));
        g.MapPost("/logout", () => R.NoContent());
    }
}
