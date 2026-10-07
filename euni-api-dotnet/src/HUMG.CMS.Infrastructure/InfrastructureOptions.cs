namespace HUMG.CMS.Infrastructure;

/// <summary>Cấu hình hạ tầng (đọc từ biến môi trường, xem Program.cs).</summary>
public sealed class InfrastructureOptions
{
    /// <summary>Kết nối của ỨNG DỤNG: role <c>cms_app</c> (NOBYPASSRLS) — mọi request nghiệp vụ.</summary>
    public string DatabaseUrl { get; set; } = "Host=127.0.0.1;Port=5432;Database=euni_cms;Username=cms_app;Password=cms_app_dev";
    /// <summary>Kết nối BẢO TRÌ: role <c>cms_admin</c> (BYPASSRLS) — dựng lược đồ, nạp dữ liệu mẫu, sao lưu/phục hồi.</summary>
    public string DatabaseAdminUrl { get; set; } = "Host=127.0.0.1;Port=5432;Database=euni_cms;Username=cms_admin;Password=cms_admin_dev";
    /// <summary>Tự áp lược đồ và nạp dữ liệu mẫu khi database trống.</summary>
    public bool Migrate { get; set; } = true;
    public string MockDataDir { get; set; } = "mock-data";
    public string UploadDir { get; set; } = "uploads";
    public string JwtSecret { get; set; } = "dev-only-change-me";
    public string JwtExpiresIn { get; set; } = "8h";
}
