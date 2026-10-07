using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Datasets;

public sealed record DatasetRoute(string Route, Func<QueryParams, JsonNode> Handle);

/// <summary>
/// Dữ liệu các phân hệ KHÔNG thuộc tin tức CMS (do hệ thống ngoài cung cấp qua API gateway: qlns, qlkhcn, edusoft, esb) lấy từ <c>mock-data/*.json</c>.
///   GET /{service}/api/v1/{group}/datasets/{module}     → toàn bộ dataset của module
///   GET /{service}/api/v1/{group}/{module}/{resource}   → từng tài nguyên (mảng có phân trang pageIndex/pageSize/keyword)
/// group = <c>me</c> cho dữ liệu cá nhân của portal (module portal-*), <c>public</c> cho phần còn lại.
/// </summary>
public sealed class DatasetService
{
    /// <summary>module → service gateway. Đổi ở đây (và ở FE: lib/datasets/loaders.js) khi backend thật chia service khác.</summary>
    public static readonly IReadOnlyDictionary<string, string> ModuleService = new Dictionary<string, string>
    {
        ["about"] = "qlns-api", ["staff-hub"] = "qlns-api", ["portal-staff"] = "qlns-api", ["portal-staff-tools"] = "qlns-api", ["portal-leader"] = "qlns-api",
        ["research"] = "qlkhcn-api",
        ["admissions"] = "edusoft-api", ["education"] = "edusoft-api", ["student-hub"] = "edusoft-api", ["portal-student"] = "edusoft-api", ["portal-parent"] = "edusoft-api",
        ["library"] = "esb-api",
        ["cooperation"] = "cms-api", ["life"] = "cms-api", ["utilities"] = "cms-api",
    };

    /// <summary>Service chỉ có dataset (cms-api có router riêng, chỉ gắn thêm phần dataset).</summary>
    public static readonly string[] Services = ModuleService.Values.Distinct().Where(s => s != "cms-api").ToArray();

    public static string GroupOf(string module) => module.StartsWith("portal-") ? "me" : "public";
    public static string Kebab(string s) => Regex.Replace(s, "([a-z0-9])([A-Z])", "$1-$2").ToLowerInvariant();

    private readonly Dictionary<string, JsonNode> _data = new();

    public DatasetService(IMockData mock)
    {
        foreach (var name in mock.Names) if (ModuleService.ContainsKey(name)) _data[name] = mock.Load(name);
    }

    public JsonNode Dataset(string service, string group, string module) =>
        ModuleService.TryGetValue(module, out var s) && s == service && GroupOf(module) == group && _data.TryGetValue(module, out var d)
            ? d.DeepClone() : throw HttpError.NotFound("Không có dataset.");

    public IEnumerable<DatasetRoute> Routes(string service)
    {
        foreach (var (module, d) in _data)
        {
            if (ModuleService[module] != service || d is not JsonObject obj) continue;
            foreach (var (key, value) in obj)
            {
                var v = value;
                yield return new DatasetRoute($"/api/v1/{GroupOf(module)}/{module}/{Kebab(key)}", q =>
                {
                    if (v is not JsonArray arr) return v?.DeepClone() ?? JsonValue.Create((string?)null)!;
                    var items = arr.Objects().ToList();
                    if (q.Is("keyword")) { var kw = TextUtil.Norm(q["keyword"]); items = items.Where(x => TextUtil.Norm(Doc.Stringify(x)).Contains(kw)).ToList(); }
                    return Paging.Paged(items, q);
                });
            }
        }
        // Hai endpoint có trong Swagger thật của gateway demo (đưa về quy ước /api/v1/public/...)
        if (service == "qlkhcn-api" && _data.TryGetValue("research", out var research))
            yield return new DatasetRoute("/api/v1/public/research-topic-categories", q =>
            {
                var list = research["researchFields"].Strings().Select((n, i) => new JsonObject { ["id"] = i + 1, ["code"] = $"LV{i + 1:00}", ["name"] = n }).ToList();
                if (q.Is("keyword")) list = list.Where(x => TextUtil.Norm(x.Str("name")).Contains(TextUtil.Norm(q["keyword"]))).ToList();
                return Paging.Paged(list, q);
            });
        if (service == "qlns-api" && _data.TryGetValue("about", out var about))
            yield return new DatasetRoute("/api/v1/public/employees", q =>
            {
                var o = new List<JsonObject>();
                if (about["facultyDepartments"] is JsonObject fd)
                    foreach (var khoa in fd.Select(k => k.Value))
                        foreach (var dept in khoa.Objects())
                            foreach (var l in dept.Get("lecturers").Objects())
                                o.Add(new JsonObject { ["id"] = l.Get("id")?.DeepClone(), ["fullName"] = l.Get("name")?.DeepClone(), ["position"] = l.Get("position")?.DeepClone(), ["email"] = l.Get("email")?.DeepClone(),
                                    ["department"] = dept.Get("name")?.DeepClone(), ["publications"] = l.Get("pubs")?.DeepClone(), ["isCurrent"] = true });
                if (q.Is("keyword")) o = o.Where(x => TextUtil.Norm($"{x.Str("fullName")} {x.Str("department")}").Contains(TextUtil.Norm(q["keyword"]))).ToList();
                return Paging.Paged(o, q);
            });
    }
}
