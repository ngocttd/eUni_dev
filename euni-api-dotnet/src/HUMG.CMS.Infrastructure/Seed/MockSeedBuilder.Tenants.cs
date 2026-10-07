using System.Text.Json.Nodes;
using HUMG.CMS.Application.Features.Tenants;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Seed;

public sealed partial class MockSeedBuilder
{
    /// <summary>Website Khoa CNTT (tenant <c>cntt</c>): cấu hình, chuyên mục, bài viết, khối trang chủ, trang tĩnh, menu, banner riêng.</summary>
    private void SeedTenantCntt(JsonObject root, JsonObject humgSettings)
    {
        const string T = "cntt";
        var s = (JsonObject)humgSettings.DeepClone();
        var general = (JsonObject)s["general"]!;
        s["general"] = M(general, O(("siteName", "Khoa Công nghệ thông tin – HUMG"), ("email", "cntt@humg.edu.vn"), ("phone", "024.3838.9633"),
            ("address", "Tầng 3, nhà C12, Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Bắc Từ Liêm, Hà Nội"),
            ("brandName", "KHOA CÔNG NGHỆ THÔNG TIN"), ("brandNameEn", "FACULTY OF INFORMATION TECHNOLOGY"), ("tagline", "Trường Đại học Mỏ - Địa chất"), ("taglineEn", "Hanoi University of Mining and Geology")));
        s["seo"] = M((JsonObject)s["seo"]!, O(("metaTitle", "Khoa Công nghệ thông tin | HUMG"), ("facebook", "https://facebook.com/cntt.humg"), ("youtube", "")));
        ((JsonObject)root["settings"]!)[T] = s;

        var c1 = Add("categories", O(("tenantId", T), ("parentId", null), ("name", "Tin tức Khoa"), ("slug", "tin-tuc-khoa"), ("description", null), ("sortOrder", 0), ("isActive", true), ("translations", new JsonObject())));
        var c2 = Add("categories", O(("tenantId", T), ("parentId", null), ("name", "Nghiên cứu – Học thuật"), ("slug", "nghien-cuu-hoc-thuat"), ("description", null), ("sortOrder", 1), ("isActive", true), ("translations", new JsonObject())));
        void Post(JsonObject o)
        {
            var publishAt = o.Get("publishAt");
            var created = publishAt is not null ? publishAt : JsonValue.Create("2025-05-20T08:00:00+07:00");
            var status = o.Has("status") ? o.Str("status") : "published";
            Add("contents", M(O(("tenantId", T), ("categoryId", c1.Id()), ("ownerUnitCode", "CNTT"), ("excerpt", null), ("status", "published"), ("isFeatured", false), ("showOnHome", true), ("contentBody", "[]"),
                ("metaTitle", null), ("metaDescription", null), ("metaKeywords", null), ("featuredImageId", null), ("attachmentId", null), ("authorSub", "u-pvloc"), ("authorName", "Phạm Văn Lộc"),
                ("source", null), ("unit", "Khoa CNTT"), ("viewCount", 0), ("tags", new JsonArray()), ("attachments", new JsonArray()), ("translations", new JsonObject()), ("expireAt", null),
                ("submittedAt", null), ("submittedBy", null), ("reviewedAt", null), ("reviewedBy", null), ("reviewNote", null), ("pendingRevisionId", null), ("version", 1),
                ("createdBy", "u-pvloc"), ("updatedBy", "u-pvloc"), ("deletedAt", null), ("deletedBy", null)), o,
                O(("createdAt", created), ("updatedAt", created), ("firstPublishedAt", status == "draft" ? null : publishAt))));
        }
        Post(O(("title", "Khoa CNTT khai giảng lớp chuyên đề Trí tuệ nhân tạo ứng dụng"), ("slug", "khoa-cntt-khai-giang-chuyen-de-ai"), ("excerpt", "Lớp chuyên đề dành cho sinh viên năm 3, năm 4 các ngành CNTT, KHMT."),
            ("contentBody", Doc.Stringify(new JsonArray("Khoa Công nghệ thông tin tổ chức lớp chuyên đề Trí tuệ nhân tạo ứng dụng trong khai thác mỏ và địa chất."))), ("publishAt", "2025-05-22T08:00:00+07:00"), ("isFeatured", true), ("tags", Strs("AI", "chuyên đề"))));
        Post(O(("title", "Seminar Bộ môn Khoa học máy tính tháng 6"), ("slug", "seminar-bm-khmt-thang-6"), ("categoryId", c2.Id()), ("ownerUnitCode", "BM-KHMT"), ("excerpt", "Chủ đề: Xử lý ảnh viễn thám bằng học sâu."),
            ("contentBody", Doc.Stringify(new JsonArray("Seminar định kỳ của Bộ môn KHMT."))), ("publishAt", "2025-05-25T14:00:00+07:00"), ("authorSub", "u-dvtung"), ("authorName", "Đỗ Văn Tùng"), ("createdBy", "u-dvtung")));
        Post(O(("title", "Kế hoạch thực tập doanh nghiệp hè 2025 (bản nháp)"), ("slug", "ke-hoach-thuc-tap-he-2025"), ("status", "draft"), ("publishAt", null), ("excerpt", "Dự thảo kế hoạch thực tập."), ("showOnHome", false)));

        List<JsonObject> Pick(string name, int n) => Rows(name).Where(r => r.Str("tenantId") == "humg").Take(n).ToList()
            .Select(r => { var c = r.Copy(); c.Remove("id"); c.Remove("tenantId"); return Add(name, M(c, O(("tenantId", T)))); }).ToList();
        var slide = Pick("heroSlides", 1)[0];
        foreach (var kv in O(("code", "cntt-hero"), ("kicker", "KHOA CNTT"), ("title", "CÔNG NGHỆ THÔNG TIN\nCHO NGÀNH MỎ – ĐỊA CHẤT"), ("subtitle", "HUMG"), ("primaryLabel", "Giới thiệu Khoa"),
            ("primaryUrl", "/gioi-thieu"), ("accentLabel", "Tuyển sinh"), ("accentUrl", "/hoc-tap/tuyen-sinh"))) slide[kv.Key] = kv.Value?.DeepClone();
        Pick("quickLinks", 4); Pick("audiences", 6); Pick("strengths", 3); Pick("partners", 4);
        Add("events", O(("tenantId", T), ("slug", "ngay-hoi-viec-lam-cntt-2025"), ("title", "Ngày hội việc làm CNTT 2025"), ("startsAt", "2025-06-14T08:00:00+07:00"), ("endsAt", "2025-06-14T16:30:00+07:00"),
            ("place", "Sảnh nhà C"), ("placeFull", "Sảnh nhà C, Trường ĐH Mỏ - Địa chất"), ("organizer", "Khoa Công nghệ thông tin"), ("audience", "Sinh viên Khoa CNTT"), ("contact", null),
            ("status", "upcoming"), ("description", Strs("Gặp gỡ hơn 20 doanh nghiệp công nghệ.")), ("agenda", new JsonArray()), ("isVisible", true)));
        Add("videos", O(("tenantId", T), ("slug", "gioi-thieu-khoa-cntt"), ("title", "Giới thiệu Khoa Công nghệ thông tin"), ("channel", "Khoa CNTT"), ("durationSec", 185), ("videoUrl", null), ("viewCount", 820),
            ("publishedAt", "2025-04-02"), ("description", "Video giới thiệu ngành học và cơ sở vật chất của Khoa."), ("isVisible", true)));
        foreach (var r in Rows("siteStats").Where(r => r.Str("tenantId") == "humg").ToList()) { var c = r.Copy(); c.Remove("id"); c.Remove("tenantId"); Add("siteStats", M(c, O(("tenantId", T)))); }

        /* trang tĩnh của Khoa (soạn ở CMS, hiện ở /trang/{slug} trên website Khoa) */
        JsonObject Pg(JsonObject o) => Add("pages", M(O(("tenantId", T), ("parentId", null), ("template", "default"), ("path", null), ("status", "published"), ("sortOrder", 0), ("translations", new JsonObject()),
            ("updatedAt", "2025-05-20T08:00:00+07:00"), ("createdAt", "2025-05-20T08:00:00+07:00"), ("deletedAt", null)), o));
        var intro = Pg(O(("slug", "gioi-thieu-khoa"), ("title", "Giới thiệu Khoa"), ("sortOrder", 0),
            ("bodyHtml", "<p>Khoa Công nghệ thông tin được thành lập năm 2001, đào tạo kỹ sư và thạc sĩ Công nghệ thông tin, Khoa học máy tính, Hệ thống thông tin, gắn với ứng dụng trong ngành Mỏ – Địa chất – Năng lượng.</p><h2>Sứ mạng</h2><p>Đào tạo nguồn nhân lực CNTT chất lượng cao, nghiên cứu và chuyển giao công nghệ số cho các lĩnh vực Trái đất và Tài nguyên.</p><h2>Con số</h2><ul><li>4 bộ môn, hơn 60 cán bộ, giảng viên</li><li>Hơn 2.000 sinh viên đang học</li><li>3 phòng thí nghiệm chuyên sâu: AI, GIS, An toàn thông tin</li></ul>"),
            ("translations", O(("en", O(("status", "done"), ("title", "About the Faculty"), ("bodyHtml", "<p>The Faculty of Information Technology was founded in 2001 and trains engineers and masters in IT, Computer Science and Information Systems, with applications in mining, geology and energy.</p>")))))));
        Pg(O(("slug", "cac-bo-mon"), ("title", "Các bộ môn"), ("parentId", intro.Id()), ("sortOrder", 1),
            ("bodyHtml", "<ul><li><strong>Bộ môn Khoa học máy tính</strong> — trí tuệ nhân tạo, xử lý ảnh viễn thám.</li><li><strong>Bộ môn Công nghệ phần mềm</strong> — phát triển phần mềm, kiểm thử.</li><li><strong>Bộ môn Hệ thống thông tin</strong> — cơ sở dữ liệu, GIS.</li><li><strong>Bộ môn Mạng máy tính</strong> — mạng, an toàn thông tin.</li></ul>"),
            ("translations", O(("en", O(("status", "done"), ("title", "Departments")))))));
        Pg(O(("slug", "lien-he-khoa"), ("title", "Liên hệ Khoa"), ("sortOrder", 2),
            ("bodyHtml", "<p><strong>Văn phòng Khoa Công nghệ thông tin</strong></p><p>Tầng 3, nhà C12, Trường Đại học Mỏ - Địa chất, 18 Phố Viên, Bắc Từ Liêm, Hà Nội</p><p>Điện thoại: 024.3838.9633 · Email: cntt@humg.edu.vn</p><p>Giờ làm việc: 7h30 – 17h00, thứ Hai đến thứ Sáu.</p>"),
            ("translations", O(("en", O(("status", "done"), ("title", "Contact the Faculty")))))));
        var pi = 0; foreach (var x in SamplePages.All()) Pg(M(x, O(("sortOrder", 10 + pi++))));

        /* menu của Khoa */
        JsonObject Menu(JsonObject o, string? en = null) => Add("menuItems", M(O(("tenantId", T), ("groupCode", "header"), ("parentId", null), ("type", "page"), ("icon", null), ("sortOrder", 1), ("isVisible", true), ("openInNewTab", false), ("deletedAt", null)), o,
            O(("translations", en is not null ? O(("en", O(("label", en), ("status", "done")))) : new JsonObject()))));
        void Top(string label, string en, int sortOrder, (string L, string E, string Url)[] children, string icon)
        {
            var r = Menu(O(("label", label), ("sortOrder", sortOrder), ("url", children.Length > 0 ? children[0].Url : null), ("icon", icon)), en);
            for (var i = 0; i < children.Length; i++) Menu(O(("label", children[i].L), ("url", children[i].Url), ("parentId", r.Id()), ("sortOrder", i + 1)), children[i].E);
        }
        Top("Giới thiệu Khoa", "About", 1, new[] { ("Giới thiệu chung", "Overview", "/trang/gioi-thieu-khoa"), ("Các bộ môn", "Departments", "/trang/cac-bo-mon") }, "building");
        Top("Đào tạo", "Education", 2, new[] { ("Chương trình đào tạo", "Programs", "/hoc-tap/chuong-trinh-dao-tao"), ("Tuyển sinh", "Admissions", "/hoc-tap/tuyen-sinh"), ("Lịch học – Lịch thi", "Timetable & Exams", "/hoc-tap/lich-hoc") }, "graduation");
        Top("Tin tức – Sự kiện", "News & Events", 3, new[] { ("Tin tức Khoa", "Faculty news", "/tin-tuc"), ("Sự kiện", "Events", "/su-kien"), ("Media", "Media", "/media") }, "newspaper");
        Menu(O(("label", "Liên hệ"), ("url", "/trang/lien-he-khoa"), ("icon", "phone"), ("sortOrder", 4)), "Contact");
        Menu(O(("label", "Website Trường"), ("url", "https://humg.edu.vn"), ("icon", "globe"), ("sortOrder", 5), ("openInNewTab", true), ("type", "link")), "University website");
        var col1 = Menu(O(("groupCode", "footer"), ("label", "Khoa Công nghệ thông tin"), ("type", "heading"), ("url", null), ("sortOrder", 1)), "Faculty of IT");
        var f1 = new[] { ("Giới thiệu Khoa", "About", "/trang/gioi-thieu-khoa"), ("Các bộ môn", "Departments", "/trang/cac-bo-mon"), ("Tin tức Khoa", "Faculty news", "/tin-tuc"), ("Liên hệ Khoa", "Contact", "/trang/lien-he-khoa") };
        for (var i = 0; i < f1.Length; i++) Menu(O(("groupCode", "footer"), ("parentId", col1.Id()), ("label", f1[i].Item1), ("url", f1[i].Item3), ("sortOrder", i + 1)), f1[i].Item2);
        var col2 = Menu(O(("groupCode", "footer"), ("label", "Chính sách & Quy định"), ("type", "heading"), ("url", null), ("sortOrder", 2)), "Policies");
        var f2 = new[] { ("Chính sách bảo mật", "Privacy policy", "/trang/chinh-sach-bao-mat"), ("Điều khoản sử dụng", "Terms of use", "/trang/dieu-khoan-su-dung") };
        for (var i = 0; i < f2.Length; i++) Menu(O(("groupCode", "footer"), ("parentId", col2.Id()), ("label", f2[i].Item1), ("url", f2[i].Item3), ("sortOrder", i + 1)), f2[i].Item2);
        Menu(O(("groupCode", "utility"), ("label", "Liên hệ"), ("url", "/trang/lien-he-khoa"), ("sortOrder", 1)), "Contact");
        Menu(O(("groupCode", "utility"), ("label", "Website Trường"), ("url", "https://humg.edu.vn"), ("sortOrder", 2), ("openInNewTab", true), ("type", "link")), "University website");

        /* banner của Khoa */
        Add("banners", O(("tenantId", T), ("position", "home_slider"), ("title", "Tuyển sinh ngành Khoa học dữ liệu 2026"), ("subtitle", "Chương trình mới của Khoa CNTT — học bổng cho 20 thí sinh đầu vào"),
            ("linkUrl", "/hoc-tap/tuyen-sinh"), ("imageId", null), ("isVisible", true), ("sortOrder", 1), ("startsOn", Day(-5)), ("endsOn", Day(60)), ("deletedAt", null)));
        Add("banners", O(("tenantId", T), ("position", "sidebar_right"), ("title", "Ngày hội việc làm CNTT"), ("subtitle", "Hơn 20 doanh nghiệp công nghệ"), ("linkUrl", "/su-kien"), ("imageId", null),
            ("isVisible", true), ("sortOrder", 1), ("startsOn", Day(-3)), ("endsOn", Day(40)), ("deletedAt", null)));
    }

    /// <summary>Thông báo mẫu: workflow, đối tượng nhận (audience × đơn vị × cá nhân, có loại trừ), hẹn giờ, xác nhận đã đọc.</summary>
    private void SeedAnnouncements()
    {
        static string D(double days, int? h = 8)
        {
            var x = DateTimeOffset.UtcNow.AddMilliseconds(days * 86400000);
            if (h is not null) { var l = x.ToLocalTime(); x = new DateTimeOffset(l.Year, l.Month, l.Day, h.Value, 0, 0, l.Offset); }
            return TimeUtil.ToIso(x);
        }
        JsonObject T(string? audience, string? unit, string? user, bool exclude, string label) => O(("audience", audience), ("unitCode", unit), ("userSub", user), ("isExclude", exclude), ("label", label));
        void Ann(JsonObject o)
        {
            var author = o.Has("authorSub") ? o.Str("authorSub") : "u-nthoa";
            var publishAt = o.Get("publishAt");
            var createdAt = publishAt is not null ? publishAt : JsonValue.Create(D(-1));
            var status = o.Has("status") ? o.Str("status") : "published";
            Add("announcements", M(O(("tenantId", "humg"), ("category", "general"), ("priority", 0), ("status", "published"), ("expireAt", null), ("pinnedUntil", null), ("requireAck", false), ("channels", Strs("portal")),
                ("recallReason", null), ("bodyHtml", ""), ("translations", new JsonObject()), ("attachments", new JsonArray()), ("authorSub", "u-nthoa"), ("authorName", "Nguyễn Thị Hoa"),
                ("submittedAt", null), ("submittedBy", null), ("reviewedAt", null), ("reviewedBy", null), ("reviewNote", null), ("pendingRevisionId", null), ("version", 1),
                ("createdBy", author), ("updatedBy", author), ("deletedAt", null), ("deletedBy", null)), o,
                O(("createdAt", createdAt), ("updatedAt", createdAt), ("firstPublishedAt", status != "published" ? null : publishAt))));
        }
        var allStudents = T("student", null, null, false, "Toàn bộ sinh viên");
        Ann(O(("title", "Lịch thi học kỳ 2 năm học 2024–2025"), ("ownerUnitCode", "P-DT"), ("category", "exam"), ("priority", 1), ("publishAt", D(-3)), ("pinnedUntil", D(10)), ("requireAck", true), ("channels", Strs("portal", "email")),
            ("bodyHtml", "<p>Phòng Đào tạo thông báo lịch thi học kỳ 2. Sinh viên kiểm tra phòng thi trên My eUni và <strong>xác nhận đã đọc</strong>.</p>"),
            ("translations", O(("en", O(("title", "Semester 2 exam schedule 2024–2025"), ("bodyHtml", "<p>The Academic Affairs Office announces the semester 2 exam schedule.</p>"), ("status", "done"))))),
            ("targets", new JsonArray(allStudents.Copy())), ("attachments", new JsonArray(O(("title", "Lich-thi-HK2.pdf"), ("meta", "PDF · 420 KB"))))));
        Ann(O(("title", "Hạn nộp học phí học kỳ 2"), ("ownerUnitCode", "P-DT"), ("category", "tuition"), ("priority", 2), ("publishAt", D(-2)), ("expireAt", D(20)), ("channels", Strs("portal", "email", "push")),
            ("bodyHtml", "<p>Hạn cuối nộp học phí học kỳ 2 là ngày 30/06. Sinh viên quá hạn sẽ bị khóa đăng ký học phần.</p>"),
            ("targets", new JsonArray(allStudents.Copy(), T("parent", null, null, false, "Phụ huynh")))));
        Ann(O(("title", "Họp giao ban Khoa CNTT tháng 6"), ("ownerUnitCode", "CNTT"), ("category", "admin"), ("publishAt", D(-1)), ("authorSub", "u-pvloc"), ("authorName", "Phạm Văn Lộc"),
            ("bodyHtml", "<p>Kính mời toàn thể giảng viên Khoa CNTT dự họp giao ban lúc 14:00 thứ Sáu tại phòng 302-C.</p>"),
            ("targets", new JsonArray(T("lecturer", "CNTT", null, false, "Giảng viên Khoa CNTT")))));
        Ann(O(("title", "Lớp DCCTKT66A: đổi phòng học môn Cơ sở dữ liệu"), ("ownerUnitCode", "BM-KHMT"), ("category", "academic"), ("publishAt", D(-0.1, null)), ("authorSub", "u-dvtung"), ("authorName", "Đỗ Văn Tùng"),
            ("bodyHtml", "<p>Từ tuần 12, môn Cơ sở dữ liệu của lớp DCCTKT66A chuyển sang phòng 405-A.</p>"),
            ("targets", new JsonArray(T(null, "DCCTKT66A", null, false, "Lớp DCCTKT66A")))));
        Ann(O(("title", "Xác nhận hướng dẫn đồ án tốt nghiệp"), ("ownerUnitCode", "BM-KHMT"), ("category", "academic"), ("priority", 1), ("publishAt", D(-1)), ("requireAck", true), ("authorSub", "u-dvtung"), ("authorName", "Đỗ Văn Tùng"),
            ("bodyHtml", "<p>Em Nguyễn Văn Sinh đã được phân công GV hướng dẫn đồ án: TS. Nguyễn Thanh Bình.</p>"),
            ("targets", new JsonArray(T(null, null, "SV001", false, "2151000123 – Nguyễn Văn Sinh"), T(null, null, "GV002", false, "GV0123 – TS. Nguyễn Thanh Bình")))));
        Ann(O(("title", "Khảo sát chất lượng dịch vụ (trừ lớp đang thực tập)"), ("ownerUnitCode", "P-CTSV"), ("category", "general"), ("publishAt", D(-4)),
            ("bodyHtml", "<p>Mời sinh viên tham gia khảo sát chất lượng dịch vụ hỗ trợ người học.</p>"),
            ("targets", new JsonArray(allStudents.Copy(), T(null, "DCKTM66", null, true, "Lớp DCKTM66")))));
        Ann(O(("title", "Kế hoạch nghỉ hè 2025 (chờ duyệt)"), ("ownerUnitCode", "P-DT"), ("status", "pending_review"), ("publishAt", null), ("submittedAt", D(-0.05, null)), ("submittedBy", "u-hdnam"),
            ("authorSub", "u-hdnam"), ("authorName", "Hoàng Đức Nam"), ("bodyHtml", "<p>Dự thảo kế hoạch nghỉ hè cho cán bộ và sinh viên.</p>"),
            ("targets", new JsonArray(T(null, null, null, false, "Mọi người")))));
        Ann(O(("title", "Đăng ký học phần học kỳ hè (hẹn giờ)"), ("ownerUnitCode", "P-DT"), ("category", "academic"), ("publishAt", D(3)),
            ("bodyHtml", "<p>Cổng đăng ký học phần học kỳ hè mở từ ngày đăng thông báo này.</p>"), ("targets", new JsonArray(allStudents.Copy()))));
        Ann(O(("tenantId", "cntt"), ("title", "Sinh viên Khoa CNTT đăng ký đề tài NCKH 2025"), ("ownerUnitCode", "CNTT"), ("category", "academic"), ("publishAt", D(-2)), ("authorSub", "u-pvloc"), ("authorName", "Phạm Văn Lộc"),
            ("bodyHtml", "<p>Khoa CNTT nhận đăng ký đề tài NCKH sinh viên đến hết 15/06.</p>"),
            ("targets", new JsonArray(T("student", "CNTT", null, false, "Sinh viên Khoa CNTT")))));
        Col("announcements");
    }
}
