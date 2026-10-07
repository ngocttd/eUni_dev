using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Tenants;

/// <summary>Trang tĩnh mẫu (chính sách, điều khoản) dùng khi dựng dữ liệu mẫu và khi tạo trang đơn vị mới.</summary>
public static class SamplePages
{
    public static IEnumerable<JsonObject> All() => new[]
    {
        new JsonObject
        {
            ["slug"] = "chinh-sach-bao-mat", ["title"] = "Chính sách bảo mật",
            ["bodyHtml"] = "<p>Trường Đại học Mỏ – Địa chất cam kết bảo vệ thông tin cá nhân của người dùng Cổng thông tin điện tử.</p><h2>1. Thông tin thu thập</h2><p>Họ tên, email, số điện thoại khi người dùng gửi liên hệ hoặc đăng ký sự kiện; thông tin đăng nhập do hệ thống SSO của Trường quản lý.</p><h2>2. Mục đích sử dụng</h2><ul><li>Phản hồi yêu cầu, gửi thông báo liên quan.</li><li>Thống kê truy cập để cải thiện dịch vụ.</li></ul><h2>3. Liên hệ</h2><p>Mọi thắc mắc về dữ liệu cá nhân xin gửi về Phòng Truyền thông.</p>",
            ["translations"] = new JsonObject { ["en"] = new JsonObject { ["status"] = "done", ["title"] = "Privacy policy",
                ["bodyHtml"] = "<p>Hanoi University of Mining and Geology is committed to protecting the personal data of portal users.</p><h2>1. Data we collect</h2><p>Name, email and phone number when you contact us or register for events; sign-in data is managed by the University SSO.</p><h2>2. How we use it</h2><ul><li>To answer requests and send related notices.</li><li>Usage statistics to improve our services.</li></ul><h2>3. Contact</h2><p>Questions about personal data can be sent to the Communications Office.</p>" } },
        },
        new JsonObject
        {
            ["slug"] = "dieu-khoan-su-dung", ["title"] = "Điều khoản sử dụng",
            ["bodyHtml"] = "<p>Khi truy cập Cổng thông tin, người dùng đồng ý với các điều khoản dưới đây.</p><h2>Bản quyền nội dung</h2><p>Nội dung, hình ảnh thuộc quyền của Trường Đại học Mỏ – Địa chất. Trích dẫn cần ghi rõ nguồn.</p><h2>Trách nhiệm người dùng</h2><p>Không sử dụng Cổng thông tin cho mục đích trái pháp luật hoặc gây ảnh hưởng tới hệ thống.</p>",
            ["translations"] = new JsonObject { ["en"] = new JsonObject { ["status"] = "done", ["title"] = "Terms of use",
                ["bodyHtml"] = "<p>By using the portal you agree to the following terms.</p><h2>Copyright</h2><p>Content and images belong to Hanoi University of Mining and Geology. Please cite the source when quoting.</p><h2>User responsibilities</h2><p>Do not use the portal for unlawful purposes or in ways that harm the system.</p>" } },
        },
    };
}
