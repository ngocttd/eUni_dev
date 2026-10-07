namespace HUMG.CMS.Domain.AccessControl;

/// <summary>
/// Phân quyền 2 tầng trên SSO (docs/design/CMS_DESIGN.md §5): realm role (persona), client role (theo app, có tiền tố).
/// Tầng 3 (trang/tenant, chuyên mục, đơn vị, bản ghi) do CMS tự phân bằng grants.
/// </summary>
public static class RoleCatalog
{
    public static readonly (string Code, string Label)[] RealmRoles =
    {
        ("student", "Sinh viên, học viên"), ("lecturer", "Giảng viên"), ("staff", "Cán bộ, chuyên viên phòng ban"),
        ("manager", "Lãnh đạo (BGH, trưởng/phó đơn vị)"), ("parent", "Phụ huynh"), ("applicant", "Thí sinh"), ("alumni", "Cựu người học"),
    };

    public static readonly (string Client, (string Code, string Label)[] Roles)[] ClientRoles =
    {
        ("cms-api", new[] { ("cms.viewer", "Xem nội dung trong CMS"), ("cms.author", "Soạn bài"), ("cms.reviewer", "Duyệt bài"), ("cms.editor", "Biên tập, xuất bản"), ("cms.admin", "Quản trị CMS, cấu hình site đơn vị") }),
        ("euni-admin-api", new[] { ("euni.dashboard-viewer", "Dashboard lãnh đạo"), ("euni.report-viewer", "Báo cáo"), ("euni.account-support", "Hỗ trợ tài khoản"), ("euni.admin", "Quản trị eUni") }),
        ("edusoft-api", new[] { ("edusoft.training-officer", "Cán bộ P.Đào tạo"), ("edusoft.grade-entry", "Nhập điểm"), ("edusoft.academic-advisor", "Cố vấn học tập"), ("edusoft.data-reader", "Đọc dữ liệu (cho job)") }),
        ("qlns-api", new[] { ("qlns.hr-officer", "Cán bộ nhân sự"), ("qlns.hr-viewer", "Xem dữ liệu nhân sự"), ("qlns.data-reader", "Đọc dữ liệu (cho job)") }),
        ("qlkhcn-api", new[] { ("qlkhcn.research-officer", "Cán bộ quản lý KHCN"), ("qlkhcn.researcher", "Nhà nghiên cứu"), ("qlkhcn.data-reader", "Đọc dữ liệu (cho job)") }),
    };

    /// <summary>Ánh xạ role (SSO) → quyền chức năng của CMS. Cấu hình tĩnh, không có màn hình quản lý role.</summary>
    public static readonly IReadOnlyDictionary<string, string[]> RolePermissions = BuildRolePermissions();

    private static Dictionary<string, string[]> BuildRolePermissions()
    {
        var d = new Dictionary<string, string[]>
        {
            ["cms.admin"] = new[] { "cms.*" },
            ["cms.editor"] = new[] { "cms.access", "news.view", "news.edit", "news.review", "news.publish", "announcement.view", "announcement.edit", "announcement.review", "announcement.publish",
                "media.manage", "category.manage", "page.manage", "menu.manage", "site.manage", "log.view" },
            ["cms.reviewer"] = new[] { "cms.access", "news.view", "news.review", "announcement.view", "announcement.review" },
            ["cms.author"] = new[] { "cms.access", "news.view", "news.edit", "announcement.view", "announcement.edit", "media.manage" },
            ["cms.viewer"] = new[] { "cms.access", "news.view", "announcement.view" },
        };
        foreach (var (code, _) in RealmRoles) d[code] = new[] { $"portal.{code}.view" };
        return d;
    }

    public static readonly IReadOnlyDictionary<string, string> RoleLabel = new Dictionary<string, string>
    {
        ["cms.admin"] = "Quản trị CMS", ["cms.editor"] = "Biên tập viên", ["cms.reviewer"] = "Người duyệt", ["cms.author"] = "Tác giả", ["cms.viewer"] = "Người xem",
    };
    public static readonly string[] CmsOrder = { "cms.admin", "cms.editor", "cms.reviewer", "cms.author", "cms.viewer" };

    /// <summary>realm role → cổng My eUni.</summary>
    public static readonly IReadOnlyDictionary<string, string> PortalOf = new Dictionary<string, string>
    {
        ["student"] = "/euni/sinh-vien", ["lecturer"] = "/euni/giang-vien", ["staff"] = "/euni/giang-vien", ["manager"] = "/euni/lanh-dao", ["parent"] = "/euni/phu-huynh",
    };
    /// <summary>Thứ tự ưu tiên khi user có nhiều realm role.</summary>
    public static readonly string[] PortalRoles = { "manager", "lecturer", "staff", "student", "parent", "applicant", "alumni" };
    public static readonly IReadOnlyDictionary<string, string> DemoSub = new Dictionary<string, string>
    {
        ["student"] = "SV001", ["lecturer"] = "GV001", ["staff"] = "CB001", ["parent"] = "PH001", ["manager"] = "LD001",
    };

    public static List<string> PermissionsOf(IEnumerable<string> roles) =>
        roles.SelectMany(r => RolePermissions.TryGetValue(r, out var p) ? p : Array.Empty<string>()).Distinct().ToList();

    public static bool IsSuper(IEnumerable<string> perms) => perms.Contains("cms.*");

    public static bool HasPerm(IReadOnlyCollection<string> perms, string need) =>
        IsSuper(perms) || perms.Contains(need) || perms.Any(g => g.EndsWith(".*") && need.StartsWith(g[..^1]));
}
