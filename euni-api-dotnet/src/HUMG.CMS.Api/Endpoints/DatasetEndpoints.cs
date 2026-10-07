using HUMG.CMS.Api.Http;
using HUMG.CMS.Application.Features.Datasets;

namespace HUMG.CMS.Api.Endpoints;

/// <summary>Dataset các phân hệ ngoài (qlns, qlkhcn, edusoft, esb) và dataset tĩnh của cms-api — dữ liệu từ mock-data/*.json.</summary>
public static class DatasetEndpoints
{
    public static void MapDatasets(this IEndpointRouteBuilder app, DatasetService ds, string service, RouteGroupBuilder? routeGroup = null)
    {
        var g = routeGroup ?? app.MapGroup($"/{service}");
        g.MapGet("/api/v1/{group:regex(^(public|me)$)}/datasets/{module}", (string group, string module, DatasetService d) => R.Ok(d.Dataset(service, group, module)));
        foreach (var r in ds.Routes(service))
        {
            var route = r;
            g.MapGet(route.Route, (HttpContext h) => R.Ok(route.Handle(h.Query())));
        }
    }
}
