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
    /// <summary>Chạy worker outbox cùng API (tách riêng khi cần: đặt false ở API, chạy tiến trình khác).</summary>
    public bool OutboxRelay { get; set; } = true;
    public int OutboxPollSeconds { get; set; } = 5;
    public string MockDataDir { get; set; } = "mock-data";
    /// <summary><c>local</c> (đĩa, dev) hoặc <c>s3</c> (MinIO/S3).</summary>
    public string StorageProvider { get; set; } = "local";
    public Storage.S3Options S3 { get; set; } = new();
    public string UploadDir { get; set; } = "uploads";
    /// <summary><c>mock</c> (tự phát hành HS256, đóng vai IdS khi dev) hoặc <c>oidc</c> (chỉ kiểm tra token của Identity Server thật).</summary>
    public string AuthMode { get; set; } = "mock";
    public Security.OidcOptions Oidc { get; set; } = new();
    public string JwtSecret { get; set; } = "dev-only-change-me";
    public string JwtExpiresIn { get; set; } = "8h";
}
