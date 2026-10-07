using System.Globalization;
using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Seed;

/// <summary>
/// Dựng kho dữ liệu mẫu từ <c>mock-data/*.json</c> (port của <c>build()</c> trong store.js của mock Node).
/// Ngày trong dữ liệu mẫu (banner, thông báo hẹn giờ…) tính theo "hôm nay" để bản demo luôn có nội dung đang hiệu lực.
/// </summary>
public sealed partial class MockSeedBuilder
{
    public const int SchemaVersion = 6;
    private const string DefaultTenant = "humg";

    private readonly IMockData _mock;
    private readonly JsonObject _seq = new();
    private readonly JsonObject _cols = new();

    public MockSeedBuilder(IMockData mock) => _mock = mock;

    // ------------------------------------------------------------ hằng số dữ liệu

    private static readonly Dictionary<string, string> StatusByLabel = new() { ["Đã xuất bản"] = "published", ["Bản nháp"] = "draft", ["Chờ duyệt"] = "pending_review" };
    private static readonly Dictionary<string, string> TrByLabel = new() { ["Đã dịch"] = "done", ["Đang dịch"] = "in_progress", ["Chưa dịch"] = "missing" };
    private static readonly Dictionary<string, string> BannerPos = new() { ["Trang chủ – Slider"] = "home_slider", ["Trang chủ – Popup"] = "home_popup", ["Cột phải"] = "sidebar_right", ["Chân trang"] = "footer" };
    private static readonly Dictionary<string, string[]> IdsRole = new()
    {
        ["Super Admin"] = new[] { "cms.admin", "staff" }, ["Editor"] = new[] { "cms.editor", "staff" }, ["Author"] = new[] { "cms.author", "staff" }, ["Viewer"] = new[] { "cms.viewer", "staff" },
    };
    private static readonly Dictionary<string, string> UnitByLabel = new()
    {
        ["Khoa CNTT"] = "CNTT", ["Khoa Mỏ"] = "MO", ["Khoa Trắc địa – Bản đồ"] = "TDBD", ["Phòng Đào tạo"] = "P-DT", ["Phòng KHCN"] = "P-KHCN",
        ["Phòng Hợp tác quốc tế"] = "P-HTQT", ["Phòng CTSV"] = "P-CTSV", ["Văn phòng"] = "VP",
    };
    private static readonly Dictionary<string, string> ActionMap = new()
    {
        ["Đăng nhập"] = "login", ["Đăng bài viết"] = "post.publish", ["Cập nhật bài viết"] = "post.update", ["Xóa bài viết"] = "post.delete",
        ["Tải lên file"] = "media.upload", ["Xóa người dùng"] = "user.delete", ["Đổi cấu hình"] = "settings.update",
    };
    private static readonly Dictionary<string, string> MediaKind = new() { ["Hình ảnh"] = "image", ["Tài liệu"] = "document", ["Video"] = "video", ["Âm thanh"] = "audio" };
    private static readonly Dictionary<string, string> PageEn = new()
    {
        ["Trang chủ"] = "Home", ["Giới thiệu"] = "About", ["Media thư viện"] = "Media library", ["Đơn vị"] = "Units", ["Ban giám hiệu"] = "Board of Rectors", ["Phòng ban chức năng"] = "Offices",
        ["Khoa chuyên môn"] = "Faculties", ["Đào tạo"] = "Education", ["Nghiên cứu"] = "Research", ["Sinh viên"] = "Students", ["Tin tức – Sự kiện"] = "News & Events",
        ["Thư viện số"] = "Digital library", ["Liên hệ"] = "Contact",
    };

    /// <summary>Cây đơn vị (bản sao chỉ đọc của QLNS/QLĐT): code, tên, loại, cha.</summary>
    private static readonly (string Code, string Name, string Kind, string? Parent)[] OrgUnits =
    {
        ("HUMG", "Trường Đại học Mỏ - Địa chất", "school", null), ("VP", "Văn phòng Trường", "office", "HUMG"), ("P-TT", "Phòng Truyền thông", "office", "HUMG"),
        ("P-DT", "Phòng Đào tạo", "office", "HUMG"), ("P-CTSV", "Phòng Công tác sinh viên", "office", "HUMG"), ("P-KHCN", "Phòng Khoa học công nghệ", "office", "HUMG"),
        ("P-HTQT", "Phòng Hợp tác quốc tế", "office", "HUMG"), ("CNTT", "Khoa Công nghệ thông tin", "faculty", "HUMG"), ("BM-KHMT", "Bộ môn Khoa học máy tính", "department", "CNTT"),
        ("BM-CNPM", "Bộ môn Công nghệ phần mềm", "department", "CNTT"), ("DCCTKT66A", "Lớp DCCTKT66A", "class", "BM-KHMT"), ("DCCTKT66B", "Lớp DCCTKT66B", "class", "BM-CNPM"),
        ("MO", "Khoa Mỏ", "faculty", "HUMG"), ("BM-KTM", "Bộ môn Khai thác mỏ", "department", "MO"), ("DCKTM66", "Lớp DCKTM66", "class", "BM-KTM"), ("TDBD", "Khoa Trắc địa – Bản đồ", "faculty", "HUMG"),
    };

    // ------------------------------------------------------------ tiện ích

    private static string Iso(string dmy, string hm = "08:00") { var p = dmy.Split('/'); return $"{p[2]}-{p[1]}-{p[0]}T{hm}:00+07:00"; }
    private static string IsoDate(string dmy) { var p = dmy.Split('/'); return $"{p[2]}-{p[1]}-{p[0]}"; }
    private static long Bytes(string s)
    {
        var p = s.Split(' ');
        var n = double.Parse(p[0], CultureInfo.InvariantCulture);
        var mul = p.Length > 1 && p[1] == "KB" ? 1024 : p.Length > 1 && p[1] == "MB" ? 1048576 : 1;
        return (long)Math.Round(n * mul, MidpointRounding.AwayFromZero);
    }
    private static long Secs(string s)
    {
        var p = s.Split(':').Select(long.Parse).ToArray();
        return p.Length == 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1];
    }
    private static string Day(int n) => TimeUtil.ToIso(DateTimeOffset.UtcNow.AddMilliseconds(n * 864e5))[..10];
    private static string PadSeq(int i) => i.ToString("0000");

    private JsonArray Col(string n) => (JsonArray)(_cols[n] ??= new JsonArray())!;
    private IEnumerable<JsonObject> Rows(string n) => Col(n).OfType<JsonObject>();
    private JsonObject Add(string n, JsonObject row)
    {
        var id = (_seq.Long(n) ?? 0) + 1;
        _seq[n] = id;
        var r = new JsonObject { ["id"] = id };
        foreach (var kv in row) r[kv.Key] = kv.Value?.DeepClone();
        Col(n).Add(r);
        return r;
    }
    private static JsonObject O(params (string, object?)[] kv) => Doc.Obj(kv);
    private static JsonObject M(params JsonObject?[] parts) => Doc.Merge(parts);
    private static JsonArray Strs(params string[] s) => Doc.ArrOf(s);
    private static IEnumerable<JsonObject> Items(JsonNode? n) => n.Objects();

    // ------------------------------------------------------------ dựng

    public JsonObject Build()
    {
        var cms = (JsonObject)_mock.Load("cms"); var pub = (JsonObject)_mock.Load("content"); var home = (JsonObject)_mock.Load("home");
        var root = new JsonObject { ["seq"] = _seq, ["collections"] = _cols };

        /* languages & settings */
        _cols["languages"] = new JsonArray(Items(cms["cmsLanguages"]).Select(l => (JsonNode?)O(("code", l.Get("code")), ("label", l.Get("label")), ("flag", l.Get("flag")), ("isSource", l.Get("isSource")), ("isEnabled", true))).ToArray());
        var settings = M(cms["cmsSettings"] as JsonObject, O(("language", M(cms["cmsLanguageSettings"] as JsonObject)), ("backup", O(("cronSchedule", "0 3 * * *"), ("retentionCount", 7), ("storagePath", "/backup/cms_humg"))),
            ("home", O(("heroChips", home["heroChips"])))));
        root["settings"] = new JsonObject { ["humg"] = settings };
        root["defaultSettings"] = settings.DeepClone();
        root["i18nCoverage"] = cms["cmsI18nCoverage"]?.DeepClone();
        root["trend"] = cms["cmsDashboard"]?["trend"]?.DeepClone();

        /* ---------- Identity Server (mock): danh bạ người dùng + vai trò. CMS KHÔNG quản lý user/role. ---------- */
        _cols["orgUnits"] = new JsonArray(OrgUnits.Select(u => (JsonNode?)O(("code", u.Code), ("name", u.Name), ("kind", u.Kind), ("parentCode", u.Parent))).ToArray());
        _cols["tenants"] = new JsonArray(
            O(("id", "humg"), ("name", "Trường Đại học Mỏ - Địa chất"), ("rootUnit", "HUMG"), ("domains", Strs("localhost:3002", "127.0.0.1:3002")), ("isActive", true)),
            O(("id", "cntt"), ("name", "Khoa Công nghệ thông tin"), ("rootUnit", "CNTT"), ("domains", Strs("cntt.localhost:3002")), ("isActive", true)));

        // chỉ đơn vị (membership) + role trên SSO; trang được quản trị suy ra từ grants (tầng 3)
        var cmsScope = new Dictionary<string, (string[]? Units, string[]? Roles)>
        {
            ["tvanminh@humg.edu.vn"] = (new[] { "P-TT" }, null), ["nthoa@humg.edu.vn"] = (new[] { "P-TT" }, null),
            ["pvloc@humg.edu.vn"] = (new[] { "CNTT" }, new[] { "cms.editor", "lecturer" }), ["ltmai@humg.edu.vn"] = (new[] { "P-TT" }, null),
            ["hdnam@humg.edu.vn"] = (new[] { "P-DT" }, null), ["dvtung@humg.edu.vn"] = (new[] { "BM-KHMT" }, new[] { "cms.author", "lecturer" }),
            ["vthuong@humg.edu.vn"] = (new[] { "P-DT" }, new[] { "cms.reviewer", "staff" }), ["bmduc@humg.edu.vn"] = (new[] { "P-DT" }, null),
        };
        JsonObject AddUser(JsonObject u) => Add("users", M(O(("status", 1), ("tenants", Strs("humg")), ("units", new JsonArray()), ("roles", new JsonArray()), ("staffCode", null), ("studentCode", null),
            ("lastLoginAt", null), ("createdAt", "2025-01-10T08:00:00+07:00")), u));
        var cmsUsers = Items(cms["cmsUsers"]).ToList();
        for (var i = 0; i < cmsUsers.Count; i++)
        {
            var u = cmsUsers[i]; var email = u.Str("email")!;
            cmsScope.TryGetValue(email, out var sc);
            var username = email.Split('@')[0];
            var last = u.Str("last")!.Split(' ');
            AddUser(O(("sub", $"u-{username}"), ("username", username), ("email", email), ("fullName", u.Str("name")),
                ("roles", Doc.ArrOf(sc.Roles ?? (IdsRole.TryGetValue(u.Str("role") ?? "", out var rr) ? rr : new[] { "staff" }))), ("units", Doc.ArrOf(sc.Units ?? Array.Empty<string>())),
                ("staffCode", $"CB{PadSeq(i + 1)}"), ("status", u.Str("status") == "Hoạt động" ? 1 : 0), ("lastLoginAt", Iso(last[0], last[1]))));
        }
        foreach (var d in Directory()) AddUser(d);
        JsonObject? UserByName(string? n) => Rows("users").FirstOrDefault(u => u.Str("fullName") == n);
        var posts = Items(cms["cmsPosts"]).ToList();
        foreach (var name in posts.Select(p => p.Str("author")!).Distinct())
        {
            if (UserByName(name) is not null) continue;
            var parts = TextUtil.Slugify(name).Split('-');
            var uname = parts[^1] + string.Concat(parts[..^1].Select(w => w[0]));
            AddUser(O(("sub", $"u-{uname}"), ("username", uname), ("email", $"{uname}@humg.edu.vn"), ("fullName", name), ("roles", Strs("cms.author", "staff")), ("units", Strs("P-TT"))));
        }

        /* categories (cây) */
        var order = 0;
        JsonObject AddCat(string name, long? parentId = null, bool active = true)
        {
            var ex = Rows("categories").FirstOrDefault(c => c.Str("name") == name);
            return ex ?? Add("categories", O(("parentId", parentId), ("name", name), ("slug", TextUtil.Slugify(name)), ("description", null), ("sortOrder", order++), ("isActive", active), ("translations", new JsonObject())));
        }
        foreach (var c in Items(cms["cmsCategories"]))
        {
            var p = AddCat(c.Str("name")!, null, c.Str("status") == "Hiển thị");
            foreach (var ch in Items(c["children"])) AddCat(ch.Str("name")!, p.Id(), ch.Str("status") == "Hiển thị");
        }
        var articles = Items(pub["articles"]).ToList();
        foreach (var n in cms["cmsPostCategories"].Strings().Skip(1).Concat(pub["newsCategories"].Strings()).Concat(articles.Select(a => a.Str("category")!))) AddCat(n);
        JsonObject? CatByName(string? n) => Rows("categories").FirstOrDefault(c => c.Str("name") == n);

        /* media */
        var mai = UserByName("Lê Thị Mai")?.Str("sub");
        foreach (var f in Items(cms["cmsMedia"]))
            Add("media", O(("fileName", f.Str("name")), ("kind", MediaKind.TryGetValue(f.Str("kind") ?? "", out var mk) ? mk : "other"), ("ext", f.Str("ext")), ("mimeType", null), ("sizeBytes", Bytes(f.Str("size")!)),
                ("url", $"cms-api/uploads/{f.Str("name")}"), ("altText", null), ("caption", null), ("folder", null), ("uploadedBy", mai), ("createdAt", Iso(f.Str("date")!))));

        /* contents (bài viết) = bài quản trị + bài công khai */
        var editor = (JsonObject)cms["cmsEditorDefaults"]!; var editorEn = (JsonObject)cms["cmsEditorDefaultsEn"]!;
        var featuredSlug = home["featuredNews"]!["slug"]!.GetValue<string>();
        var homeSlugs = new HashSet<string> { featuredSlug };
        foreach (var n in Items(home["newsList"])) homeSlugs.Add(n.Str("slug")!);
        var byTitle = new Dictionary<string, JsonObject>();
        foreach (var a in articles) byTitle.TryAdd(a.Str("title")!, a);
        var used = new HashSet<string>();
        JsonObject AddContent(string slug, string category, string authorName, string status, string date, string title, string? excerpt, JsonNode body, string? unit, JsonNode? views, JsonNode? tags, JsonNode? docs, JsonObject? en, JsonObject? seo)
        {
            var author = UserByName(authorName) ?? Rows("users").First();
            var publishAt = status == "published" ? Iso(date) : null;
            return Add("contents", O(("categoryId", CatByName(category)?.Id()), ("ownerUnitCode", unit is not null && UnitByLabel.TryGetValue(unit, out var uc) ? uc : (category == "Nghiên cứu" ? "CNTT" : "P-TT")),
                ("title", title), ("slug", slug), ("excerpt", excerpt), ("status", status), ("isFeatured", slug == featuredSlug), ("showOnHome", homeSlugs.Contains(slug)), ("contentBody", Doc.Stringify(body)),
                ("metaTitle", seo?.Get("title")), ("metaDescription", seo?.Get("desc")), ("metaKeywords", seo?.Get("keywords")), ("featuredImageId", null), ("attachmentId", null),
                ("authorSub", author.Str("sub")), ("authorName", author.Str("fullName")), ("source", null), ("unit", unit), ("viewCount", views ?? JsonValue.Create(0)), ("tags", tags is null ? new JsonArray() : tags),
                ("attachments", new JsonArray(Items(docs).Select(d => (JsonNode?)O(("title", d.Get("name")), ("meta", d.Get("meta")), ("url", null))).ToArray())),
                ("translations", en is not null ? O(("en", en)) : new JsonObject()), ("publishAt", publishAt), ("expireAt", null), ("firstPublishedAt", publishAt),
                ("submittedAt", null), ("submittedBy", null), ("reviewedAt", null), ("reviewedBy", null), ("reviewNote", null), ("pendingRevisionId", null), ("version", 1),
                ("createdAt", Iso(date)), ("createdBy", author.Str("sub")), ("updatedAt", Iso(date)), ("updatedBy", author.Str("sub")), ("deletedAt", null), ("deletedBy", null)));
        }
        var i18n = (JsonObject)cms["cmsPostI18n"]!;
        foreach (var p in posts)
        {
            byTitle.TryGetValue(p.Str("title")!, out var rich);
            var id = p.Long("id");
            var first = id == 1;
            var slug = first ? editor.Str("slug")! : rich?.Str("slug") ?? TextUtil.Slugify(p.Str("title"));
            used.Add(slug);
            JsonObject? en = null;
            if (first)
                en = O(("title", editorEn.Get("title")), ("excerpt", editorEn.Get("excerpt")), ("contentBody", Doc.Stringify(new JsonArray(editorEn.Get("content")?.DeepClone()))), ("metaTitle", editorEn.Get("seoTitle")),
                    ("metaDescription", editorEn.Get("seoDesc")), ("metaKeywords", editorEn.Get("seoKeywords")), ("status", "done"));
            else if (i18n.Str((id ?? 0).ToString()) is { } lab && lab != "Chưa dịch") en = O(("title", p.Get("title")), ("status", TrByLabel.GetValueOrDefault(lab)));
            JsonNode body = first ? new JsonArray(cms["cmsEditorDefaultContentVi"]?.DeepClone()) : rich?["body"]?.DeepClone() ?? new JsonArray(JsonValue.Create($"{p.Str("title")}."));
            AddContent(slug, p.Str("category")!, p.Str("author")!, StatusByLabel.GetValueOrDefault(p.Str("status") ?? ""), p.Str("date")!, p.Str("title")!,
                first ? editor.Str("excerpt") : rich?.Str("excerpt") ?? $"{p.Str("title")}.", body, rich?.Str("unit"), rich?["views"], rich?["tags"], rich?["docs"], en,
                first ? O(("title", editor.Get("seoTitle")), ("desc", editor.Get("seoDesc")), ("keywords", editor.Get("seoKeywords"))) : null);
        }
        foreach (var a in articles)
        {
            if (used.Contains(a.Str("slug")!)) continue;
            AddContent(a.Str("slug")!, a.Str("category")!, "Nguyễn Thị Hoa", "published", a.Str("date")!, a.Str("title")!, a.Str("excerpt"), a["body"]?.DeepClone() ?? new JsonArray(), a.Str("unit"), a["views"], a["tags"], a["docs"], null, null);
        }
        // bài #1 của editor mẫu không chiếm ô "nổi bật" trang chủ
        foreach (var c in Rows("contents")) if (c.Str("slug") == editor.Str("slug")) { c["isFeatured"] = false; c["showOnHome"] = false; }

        /* events / albums / videos / podcasts */
        foreach (var e in Items(pub["events"]))
        {
            var t = (e.Str("time") ?? "").Split('–').Select(x => x.Trim()).ToArray();
            var start = t.Length > 0 && t[0].Length > 0 ? t[0] : "00:00"; var end = t.Length > 1 && t[1].Length > 0 ? t[1] : null;
            Add("events", O(("slug", e.Get("slug")), ("title", e.Get("title")), ("startsAt", Iso(e.Str("date")!, start)), ("endsAt", end is null ? null : Iso(e.Str("date")!, end)), ("place", e.Get("place")), ("placeFull", e.Get("placeFull")),
                ("organizer", e.Get("organizer")), ("audience", e.Get("audience")), ("contact", e.Get("contact")), ("status", "upcoming"), ("description", e["desc"]?.DeepClone() ?? new JsonArray()),
                ("agenda", e["agenda"]?.DeepClone() ?? new JsonArray()), ("isVisible", true)));
        }
        foreach (var a in Items(pub["albums"]))
            Add("albums", O(("slug", a.Get("slug")), ("title", a.Get("title")), ("publishedAt", IsoDate(a.Str("date")!)), ("isVisible", true),
                ("photos", new JsonArray(Items(a["photos"]).Select((p, i) => (JsonNode?)O(("id", i + 1), ("caption", p.Get("label")), ("mediaId", null), ("sortOrder", i))).ToArray()))));
        foreach (var v in Items(pub["videos"]))
            Add("videos", O(("slug", v.Get("slug")), ("title", v.Get("title")), ("channel", v.Get("channel")), ("durationSec", Secs(v.Str("duration")!)), ("videoUrl", null), ("viewCount", v.Get("views")),
                ("publishedAt", IsoDate(v.Str("date")!)), ("description", v.Get("desc")), ("isVisible", true)));
        foreach (var p in Items(pub["podcasts"]))
            Add("podcasts", O(("slug", p.Get("slug")), ("title", p.Get("title")), ("episode", p.Get("episode")), ("host", p.Get("host")), ("durationSec", Secs(p.Str("duration")!)), ("audioUrl", null),
                ("playCount", p.Get("plays")), ("publishedAt", IsoDate(p.Str("date")!)), ("description", p.Get("desc")), ("notes", p["notes"]?.DeepClone() ?? new JsonArray()), ("isVisible", true)));
        root["searchPages"] = pub["searchPages"]?.DeepClone();

        /* trang & menu — "system": route riêng của website (CMS quản lý tên/thứ tự/menu); "default": nội dung soạn ở CMS (bodyHtml), hiện ở /trang/{slug} */
        var po = 0;
        void AddPage(JsonObject n, long? parentId = null)
        {
            var name = n.Str("name")!;
            var r = Add("pages", O(("parentId", parentId), ("slug", n.Get("slug")), ("title", name), ("template", "system"), ("path", $"/{n.Str("slug")}"), ("status", "published"), ("sortOrder", po++), ("bodyHtml", ""),
                ("translations", PageEn.TryGetValue(name, out var en) ? O(("en", O(("title", en), ("status", "done")))) : new JsonObject())));
            foreach (var c in Items(n["children"])) AddPage(c, r.Id());
        }
        foreach (var n in Items(cms["cmsPageTree"])) AddPage(n);
        foreach (var pg in SamplePages.All())
            Add("pages", M(O(("parentId", null), ("template", "default"), ("path", null), ("status", "published"), ("sortOrder", po++), ("translations", new JsonObject()), ("updatedAt", "2025-05-10T09:00:00+07:00")), pg));
        var groups = new[] { "header", "footer", "utility" };
        root["menuGroups"] = new JsonArray(cms["cmsMenuGroups"].Strings().Select((n, i) => (JsonNode?)O(("code", groups[i]), ("name", n))).ToArray());
        var menuIds = new List<long>();
        foreach (var m in Items(_mock.Load("site-menus")))
        {
            var url = m.Get("url");
            var r = Add("menuItems", O(("groupCode", m.Get("group")), ("parentId", m.Get("parent") is null ? null : menuIds[(int)m.Long("parent")!.Value]), ("type", Doc.Truthy(url) ? "page" : "heading"),
                ("url", Doc.Truthy(url) ? url : null), ("label", m.Get("label")), ("icon", m.Get("icon")), ("sortOrder", m.Get("order")), ("isVisible", true), ("openInNewTab", false),
                ("translations", Doc.Truthy(m.Get("labelEn")) ? O(("en", O(("label", m.Get("labelEn")), ("status", "done")))) : new JsonObject())));
            menuIds.Add(r.Id());
        }

        /* banners — khoảng ngày tính theo hôm nay để bản demo luôn có banner đang hiệu lực */
        var bannerSeed = new Dictionary<string, JsonObject>
        {
            ["Banner tuyển sinh đại học 2025"] = O(("subtitle", "Xét tuyển 15 ngành Kỹ thuật – Công nghệ, nhận hồ sơ trực tuyến"), ("linkUrl", "/hoc-tap/tuyen-sinh"), ("startsOn", Day(-10)), ("endsOn", Day(60))),
            ["Hội thảo quốc tế Trắc địa – GIS 2025"] = O(("subtitle", "Đăng ký tham dự và gửi bài báo"), ("linkUrl", "/su-kien"), ("startsOn", Day(-5)), ("endsOn", Day(30))),
            ["Chào mừng 60 năm thành lập Trường"] = O(("subtitle", "1966 – 2026 · Chuỗi hoạt động kỷ niệm"), ("linkUrl", "/gioi-thieu/lich-su"), ("startsOn", Day(-3)), ("endsOn", Day(40))),
            ["Ngày hội việc làm HUMG 2025"] = O(("subtitle", "Hơn 80 doanh nghiệp tuyển dụng"), ("linkUrl", "/doi-song/viec-lam"), ("startsOn", Day(-7)), ("endsOn", Day(45))),
            ["Thông báo học bổng khuyến khích học tập"] = O(("subtitle", "Hạn nộp hồ sơ trong tháng này"), ("linkUrl", "/hoc-tap/hoc-phi-hoc-bong"), ("startsOn", Day(-2)), ("endsOn", Day(25))),
        };
        foreach (var b in Items(cms["cmsBanners"]))
            Add("banners", M(O(("position", BannerPos.GetValueOrDefault(b.Str("position") ?? "")), ("title", b.Get("name")), ("imageId", null), ("isVisible", b.Str("status") == "Hiển thị"), ("sortOrder", b.Get("order")),
                ("linkUrl", null), ("subtitle", null)), bannerSeed.GetValueOrDefault(b.Str("name") ?? "")));

        /* khối trang chủ */
        var hs = Items(home["heroSlides"]).ToList();
        for (var i = 0; i < hs.Count; i++)
        {
            var x = hs[i];
            Add("heroSlides", O(("code", x.Get("id")), ("kicker", x.Get("kicker")), ("title", x.Get("title")), ("subtitle", x.Get("years")), ("motto", x.Get("motto")), ("primaryLabel", x["primary"]?["label"]),
                ("primaryUrl", x["primary"]?["to"]), ("accentLabel", x["accent"]?["label"]), ("accentUrl", x["accent"]?["to"]), ("isVisible", true), ("sortOrder", i)));
        }
        void Seq2(string coll, JsonNode? src, Func<JsonObject, int, JsonObject> map) { var l = Items(src).ToList(); for (var i = 0; i < l.Count; i++) Add(coll, map(l[i], i)); }
        Seq2("quickLinks", home["quickLinks"], (x, i) => O(("label", x.Get("label")), ("icon", x.Get("icon")), ("url", x.Get("to")), ("isVisible", true), ("sortOrder", i)));
        Seq2("audiences", home["audiences"], (x, i) => O(("code", x.Get("id")), ("title", x.Get("title")), ("description", x.Get("desc")), ("icon", x.Get("icon")), ("color", x.Get("color")), ("url", x.Get("to")), ("isVisible", true), ("sortOrder", i)));
        Seq2("strengths", home["strengths"], (x, i) => O(("icon", x.Get("icon")), ("title", x.Get("title")), ("text", x.Get("text")), ("isVisible", true), ("sortOrder", i)));
        Seq2("partners", home["partners"], (x, i) => O(("name", x.Get("name")), ("shortName", x.Get("short")), ("color", x.Get("color")), ("website", null), ("isVisible", true), ("sortOrder", i)));
        Seq2("siteStats", home["heroStats"], (x, i) => O(("placement", "hero"), ("value", x.Get("value")), ("label", x.Get("label")), ("sub", null), ("isVisible", true), ("sortOrder", i)));
        Seq2("siteStats", home["universityStats"], (x, i) => O(("placement", "about"), ("value", x.Get("value")), ("label", x.Get("label")), ("sub", x.Get("sub")), ("isVisible", true), ("sortOrder", i)));

        /* nhật ký & sao lưu */
        foreach (var a in Items(cms["cmsActivity"]))
        {
            var t = a.Str("time")!.Split(' ');
            Add("activityLogs", O(("tenantId", "humg"), ("actorSub", UserByName(a.Str("user"))?.Str("sub")), ("userName", a.Get("user")), ("entityType", null), ("entityId", null), ("changes", null),
                ("action", ActionMap.GetValueOrDefault(a.Str("action") ?? "", a.Str("action")!)), ("targetLabel", a.Get("target")), ("ipAddress", a.Get("ip")), ("createdAt", Iso(t[0], t[1]))));
        }
        foreach (var b in Items(cms["cmsBackups"]))
        {
            var t = b.Str("time")!.Split(' ');
            Add("backups", O(("filePath", $"/backup/cms_humg/cms_{string.Concat(t[0].Split('/').Reverse())}.sql.gz"), ("sizeBytes", Bytes(b.Str("size")!)), ("trigger", b.Str("by")!.Contains("Cron") ? "cron" : "manual"),
                ("createdByName", b.Get("by")), ("status", "success"), ("createdAt", Iso(t[0], t[1]))));
        }
        /* ---------- tenant: toàn bộ dữ liệu trên thuộc tenant humg ---------- */
        var global = new HashSet<string> { "languages", "users", "orgUnits", "tenants" };
        foreach (var (name, list) in _cols) if (!global.Contains(name)) foreach (var r in ((JsonArray)list!).OfType<JsonObject>()) if (!r.Has("tenantId") || r.Get("tenantId") is null) r["tenantId"] = "humg";
        SeedTenantCntt(root, settings);

        /* ---------- phân quyền mức bản ghi (grants) ---------- */
        JsonObject Grant(params (string, object?)[] g) => Add("grants", M(O(("tenantId", "humg"), ("resourceType", "*"), ("scopeType", "tenant"), ("scopeId", null), ("note", null), ("expiresAt", null),
            ("createdBy", "u-tvanminh"), ("createdAt", "2025-01-10T08:00:00+07:00"), ("deletedAt", null)), O(g)));
        Grant(("principalType", "user"), ("principalId", "u-nthoa"), ("permissions", Strs("view", "edit", "review", "publish")), ("note", "Biên tập viên chính — toàn trang Trường"));
        Grant(("principalType", "role"), ("principalId", "cms.author"), ("permissions", Strs("view")), ("note", "Tác giả xem được mọi bài của Trường"));
        Grant(("principalType", "role"), ("principalId", "cms.viewer"), ("permissions", Strs("view")), ("note", "Người xem CMS xem được mọi bài của Trường"));
        Grant(("principalType", "unit"), ("principalId", "P-TT"), ("resourceType", "news"), ("scopeType", "unit"), ("scopeId", "P-TT"), ("permissions", Strs("edit")), ("note", "Thành viên Phòng Truyền thông sửa bài của phòng"));
        Grant(("principalType", "user"), ("principalId", "u-pvloc"), ("scopeType", "unit"), ("scopeId", "CNTT"), ("permissions", Strs("view", "edit", "review", "publish")), ("note", "Phụ trách nội dung Khoa CNTT trên trang Trường"));
        Grant(("principalType", "user"), ("principalId", "u-vthuong"), ("resourceType", "announcement"), ("scopeType", "unit"), ("scopeId", "P-DT"), ("permissions", Strs("review")), ("note", "Duyệt thông báo của Phòng Đào tạo"));
        Grant(("principalType", "unit"), ("principalId", "P-DT"), ("resourceType", "announcement"), ("scopeType", "unit"), ("scopeId", "P-DT"), ("permissions", Strs("edit")), ("note", "Cán bộ Phòng Đào tạo soạn thông báo của phòng"));
        Grant(("principalType", "user"), ("principalId", "u-dvtung"), ("resourceType", "news"), ("scopeType", "category"), ("scopeId", CatByName("Nghiên cứu")?.Id().ToString()), ("permissions", Strs("edit")), ("note", "Cộng tác viên chuyên mục Nghiên cứu"));
        Grant(("tenantId", "cntt"), ("principalType", "user"), ("principalId", "u-pvloc"), ("permissions", Strs("manage")), ("note", "Quản trị trang Khoa CNTT"));
        Grant(("tenantId", "cntt"), ("principalType", "unit"), ("principalId", "BM-KHMT"), ("scopeType", "unit"), ("scopeId", "BM-KHMT"), ("permissions", Strs("edit")), ("note", "Bộ môn KHMT tự soạn bài/thông báo của bộ môn"));

        SeedAnnouncements();

        /* ---------- revision v1 cho mọi bản ghi có workflow ---------- */
        foreach (var (name, type) in new[] { ("contents", "news"), ("announcements", "announcement") })
            foreach (var r in Rows(name).ToList())
                Add("revisions", O(("tenantId", r.Get("tenantId")), ("entityType", type), ("entityId", r.Id()), ("version", 1), ("state", "current"), ("snapshot", WorkflowService.RevisionSnapshot(r)),
                    ("reason", "Khởi tạo"), ("createdBy", r.Get("createdBy")), ("createdAt", r.Get("createdAt"))));
        Col("workflowHistory"); Col("receipts");
        root["schemaVersion"] = SchemaVersion;
        return root;
    }

    /// <summary>Danh bạ người dùng portal (IdS mock). 5 tài khoản demo dùng sub cố định SV001/GV001/CB001/PH001/LD001.</summary>
    private static IEnumerable<JsonObject> Directory() => new[]
    {
        O(("sub", "SV001"), ("username", "2151000123"), ("email", "2151000123@student.humg.edu.vn"), ("fullName", "Nguyễn Văn Sinh"), ("roles", Strs("student")), ("tenants", Strs("humg", "cntt")), ("units", Strs("DCCTKT66A")), ("studentCode", "2151000123")),
        O(("sub", "GV001"), ("username", "giangvien"), ("email", "giangvien@humg.edu.vn"), ("fullName", "Giảng viên HUMG"), ("roles", Strs("lecturer")), ("tenants", Strs("humg", "cntt")), ("units", Strs("BM-KHMT")), ("staffCode", "GV0001")),
        O(("sub", "PH001"), ("username", "phuhuynh"), ("email", "phuhuynh@gmail.com"), ("fullName", "Phụ huynh"), ("roles", Strs("parent")), ("tenants", Strs("humg")), ("units", Strs("DCCTKT66A"))),
        O(("sub", "LD001"), ("username", "lanhdao"), ("email", "lanhdao@humg.edu.vn"), ("fullName", "Lãnh đạo HUMG"), ("roles", Strs("manager", "lecturer", "euni.dashboard-viewer", "euni.report-viewer")), ("tenants", Strs("humg", "cntt")), ("units", Strs("HUMG")), ("staffCode", "CB0100")),
        O(("sub", "CB001"), ("username", "canbo"), ("email", "canbo@humg.edu.vn"), ("fullName", "Chuyên viên Phòng Đào tạo"), ("roles", Strs("staff", "edusoft.training-officer")), ("tenants", Strs("humg")), ("units", Strs("P-DT")), ("staffCode", "CB0001")),
        O(("sub", "SV002"), ("username", "2151000124"), ("email", "2151000124@student.humg.edu.vn"), ("fullName", "Trần Thị Lan"), ("roles", Strs("student")), ("units", Strs("DCCTKT66A")), ("studentCode", "2151000124")),
        O(("sub", "SV003"), ("username", "2151000125"), ("email", "2151000125@student.humg.edu.vn"), ("fullName", "Lê Minh Quân"), ("roles", Strs("student")), ("units", Strs("DCCTKT66A")), ("studentCode", "2151000125")),
        O(("sub", "SV004"), ("username", "2151000201"), ("email", "2151000201@student.humg.edu.vn"), ("fullName", "Phạm Thu Hà"), ("roles", Strs("student")), ("units", Strs("DCCTKT66B")), ("studentCode", "2151000201")),
        O(("sub", "SV005"), ("username", "2151000301"), ("email", "2151000301@student.humg.edu.vn"), ("fullName", "Hoàng Văn Đức"), ("roles", Strs("student")), ("units", Strs("DCKTM66")), ("studentCode", "2151000301")),
        O(("sub", "GV002"), ("username", "ntbinh"), ("email", "ntbinh@humg.edu.vn"), ("fullName", "TS. Nguyễn Thanh Bình"), ("roles", Strs("lecturer", "edusoft.academic-advisor")), ("tenants", Strs("humg", "cntt")), ("units", Strs("BM-CNPM")), ("staffCode", "GV0123")),
        O(("sub", "GV003"), ("username", "lvkhoa"), ("email", "lvkhoa@humg.edu.vn"), ("fullName", "PGS.TS. Lê Văn Khoa"), ("roles", Strs("lecturer", "qlkhcn.researcher")), ("units", Strs("BM-KTM")), ("staffCode", "GV0456")),
    };
}
