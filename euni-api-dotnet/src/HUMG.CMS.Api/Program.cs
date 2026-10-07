using HUMG.CMS.Api.Endpoints;
using HUMG.CMS.Api.Http;
using HUMG.CMS.Application;
using HUMG.CMS.Application.Features.Announcements;
using HUMG.CMS.Application.Features.Content;
using HUMG.CMS.Application.Features.Datasets;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Infrastructure;
using Microsoft.Extensions.FileProviders;

/*
 * HUMG eUni — cms-api (.NET). Modular monolith: Api → Application → Domain; Infrastructure cài các interface Application cần.
 * Giữ nguyên hợp đồng HTTP của euni-api-mock (contract/API_CONTRACT.md) nên euni-admin / euni-public không phải sửa gì.
 * Cấu hình qua biến môi trường (cùng tên với mock Node): PORT, HOST, BASE_PATH, CORS_ORIGINS, JWT_SECRET, JWT_EXPIRES_IN, API_LOG;
 * thêm cho database: DATABASE_URL (role cms_app, RLS), DATABASE_ADMIN_URL (role cms_admin: migrate/seed/sao lưu), DB_MIGRATE=false để không tự áp lược đồ.
 */
var builder = WebApplication.CreateBuilder(args);
var env = (string name, string fallback) => Environment.GetEnvironmentVariable(name) is { Length: > 0 } v ? v : fallback;

// Thư mục gốc repo = nơi có mock-data/ (chạy từ mã nguồn) hoặc thư mục chứa file thực thi (đã publish)
string FindRoot()
{
    foreach (var start in new[] { builder.Environment.ContentRootPath, AppContext.BaseDirectory })
        for (var d = new DirectoryInfo(start); d is not null; d = d.Parent)
            if (Directory.Exists(Path.Combine(d.FullName, "mock-data"))) return d.FullName;
    return AppContext.BaseDirectory;
}
var root = FindRoot();
var options = new InfrastructureOptions
{
    DatabaseUrl = env("DATABASE_URL", new InfrastructureOptions().DatabaseUrl),
    DatabaseAdminUrl = env("DATABASE_ADMIN_URL", new InfrastructureOptions().DatabaseAdminUrl),
    Migrate = !string.Equals(Environment.GetEnvironmentVariable("DB_MIGRATE"), "false", StringComparison.OrdinalIgnoreCase),
    MockDataDir = Path.GetFullPath(env("MOCK_DATA_DIR", Path.Combine(root, "mock-data"))),
    UploadDir = Path.GetFullPath(env("UPLOAD_DIR", Path.Combine(root, "uploads"))),
    JwtSecret = env("JWT_SECRET", "dev-only-change-me"),
    JwtExpiresIn = env("JWT_EXPIRES_IN", "8h"),
};
var port = env("PORT", "3000"); var host = env("HOST", "127.0.0.1");
builder.Logging.SetMinimumLevel(LogLevel.Warning);
builder.WebHost.UseUrls($"http://{host}:{port}");
var basePath = "/" + env("BASE_PATH", "/euni-mock-api").Trim('/');
var origins = env("CORS_ORIGINS", "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
var openApi = Path.Combine(root, "contract", "openapi.json");

builder.Services.AddInfrastructure(options).AddApplication();
builder.Services.AddSingleton<RequestGate>();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (origins.Length > 0) p.WithOrigins(origins); else p.SetIsOriginAllowed(_ => true);
    p.AllowAnyHeader().AllowAnyMethod().AllowCredentials().WithExposedHeaders("X-Total-Count", "ETag");
}));

var app = builder.Build();
var logger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("HUMG.CMS");
var logRequests = !string.Equals(Environment.GetEnvironmentVariable("API_LOG"), "false", StringComparison.OrdinalIgnoreCase);
app.Services.GetRequiredService<HUMG.CMS.Application.Abstractions.IDataMaintenance>().EnsureReady(); // áp lược đồ + nạp dữ liệu mẫu nếu database trống

/*
 * Khi deploy, mock được tích hợp qua API gateway: https://api-gateway-demo.humg.edu.vn/euni-mock-api (hoặc /euni-api cho bản .NET).
 * Gateway có thể cắt hoặc giữ tiền tố khi chuyển tiếp nên API nhận cả URL có và không có BASE_PATH.
 * Mọi URL media trả về đều TƯƠNG ĐỐI (vd. cms-api/uploads/x.png), không bắt đầu bằng '/'.
 */
app.UsePathBase(basePath);
app.UseApiErrors(logger);
app.UseCors();
if (logRequests) app.Use(async (http, next) => { Console.WriteLine($"{http.Request.Method} {http.Request.PathBase}{http.Request.Path}{http.Request.QueryString}"); await next(); });

Directory.CreateDirectory(options.UploadDir);
app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(options.UploadDir), RequestPath = "/cms-api/uploads", ServeUnknownFileTypes = true });

app.UseJsonNotFound();
app.UseSerialized();
app.UseRequestContext();
app.UseTenant();
app.UseRouting();

var datasets = app.Services.GetRequiredService<DatasetService>();

// cms-api
var cms = app.MapGroup("/cms-api").WithTransactionPerRequest();
cms.MapPublic();
cms.MapWorkflow<NewsProfile>("contents", "news");
cms.MapWorkflow<AnnouncementProfile>("announcements", "announcement");
cms.MapAnnouncements();
cms.MapResources();
cms.MapAdmin();
app.MapDatasets(datasets, "cms-api", cms);
cms.MapPost("/api/v1/dev/reset", (HUMG.CMS.Application.Abstractions.IDocumentStore store, HUMG.CMS.Application.Abstractions.IDataMaintenance maint) => { store.Discard(); maint.Reset(); return R.Ok(new System.Text.Json.Nodes.JsonObject { ["ok"] = true }); });

// auth-api (đóng vai Identity Server khi dev) và các service ngoài chỉ có dataset
app.MapAuthApi();
foreach (var s in DatasetService.Services) app.MapDatasets(datasets, s);

app.MapGet("/", () => R.Ok(new System.Text.Json.Nodes.JsonObject
{
    ["name"] = "HUMG eUni API gateway (.NET)",
    ["services"] = new System.Text.Json.Nodes.JsonArray(new[] { "cms-api", "auth-api" }.Concat(DatasetService.Services).Select(x => (System.Text.Json.Nodes.JsonNode?)x).ToArray()),
    ["docs"] = "docs/openapi.json",
}));
app.MapGet("/docs/openapi.json", () => File.Exists(openApi) ? Results.File(openApi, "application/json") : R.Status(404, new System.Text.Json.Nodes.JsonObject { ["message"] = "Không có openapi.json." }));

Console.WriteLine($"✔ eUni API gateway (.NET): http://{host}:{port}");
app.Run();

public partial class Program;
