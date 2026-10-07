using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Infrastructure.Persistence;
using HUMG.CMS.Infrastructure.Security;
using HUMG.CMS.Infrastructure.Storage;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace HUMG.CMS.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Hạ tầng: PostgreSQL (role ứng dụng + role bảo trì), JWT HS256 tự phát hành (đóng vai IdS khi dev), media trên đĩa.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection s, InfrastructureOptions o)
    {
        var mock = new FileMockData(o.MockDataDir);
        var appSource = new NpgsqlDataSourceBuilder(ToConnectionString(o.DatabaseUrl)).Build();
        var adminSource = new NpgsqlDataSourceBuilder(ToConnectionString(o.DatabaseAdminUrl)).Build();
        s.AddSingleton(o);
        s.AddSingleton<IMockData>(mock);
        s.AddSingleton<IDataMaintenance>(new PostgresDataMaintenance(adminSource, mock, o.Migrate));
        s.AddScoped<IDocumentStore>(sp => new PostgresDocumentStore(appSource, sp.GetRequiredService<RequestContext>()));
        s.AddSingleton<ITokenService>(new Hs256TokenService(o.JwtSecret, o.JwtExpiresIn));
        s.AddSingleton<IFileStorage>(new LocalFileStorage(o.UploadDir));
        return s;
    }

    /// <summary>Chấp nhận chuỗi kết nối Npgsql hoặc URL <c>postgres://user:pass@host:port/db</c>.</summary>
    public static string ToConnectionString(string v)
    {
        if (!v.StartsWith("postgres://") && !v.StartsWith("postgresql://")) return v;
        var u = new Uri(v);
        var ui = u.UserInfo.Split(':', 2);
        return $"Host={u.Host};Port={(u.Port > 0 ? u.Port : 5432)};Database={u.AbsolutePath.Trim('/')};Username={Uri.UnescapeDataString(ui[0])};Password={(ui.Length > 1 ? Uri.UnescapeDataString(ui[1]) : "")}";
    }
}
