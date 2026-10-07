using System.Text.Json.Nodes;

namespace HUMG.CMS.Application.Abstractions;

/// <summary>
/// Kho dữ liệu của một request (unit-of-work trên PostgreSQL). Dữ liệu được ĐỌC TRỰC TIẾP từ database; các thay đổi được gom lại
/// và ghi trong MỘT transaction khi use case thành công (<see cref="Flush"/>), hoặc bỏ nếu có lỗi (rollback).
/// Cô lập tenant do Row-Level Security của PostgreSQL bảo đảm (tenant của request được đặt vào transaction), không chỉ dựa vào bộ lọc trong code.
/// Mỗi "collection" là tập bản ghi JSON có <c>id</c> số (hoặc <c>code</c>/<c>id</c> chuỗi với bảng dùng chung).
/// </summary>
public interface IDocumentStore
{
    /// <summary>Danh sách bản ghi của collection (đọc từ DB lần đầu trong request, sau đó là bản ghi đang theo dõi thay đổi).</summary>
    List<JsonObject> Rows(string collection);

    JsonObject Insert(string collection, JsonObject data);
    /// <summary>Thêm nguyên bản ghi (không cấp id số) — dùng cho bảng khóa chuỗi như <c>tenants</c>.</summary>
    void Push(string collection, JsonObject row);
    JsonObject? Update(string collection, long id, JsonObject patch);
    bool Remove(string collection, long id);

    /// <summary>Cấu hình của một tenant (nhóm general, seo, email…); null nếu chưa có.</summary>
    JsonObject? GetSettings(string tenant);
    void SetSettings(string tenant, JsonObject settings);

    /// <summary>Metadata dùng chung (i18nCoverage, trend, searchPages, menuGroups, snapshots…).</summary>
    JsonNode? GetMeta(string key);
    void SetMeta(string key, JsonNode? value);

    /// <summary>Đánh dấu có thay đổi cần ghi (dùng khi sửa trực tiếp bản ghi đã lấy ra).</summary>
    void MarkDirty();
    /// <summary>Ghi mọi thay đổi trong một transaction rồi commit.</summary>
    void Flush();
    /// <summary>Bỏ mọi thay đổi chưa ghi (rollback).</summary>
    void Discard();
}

/// <summary>
/// Tác vụ quản trị dữ liệu chạy bằng role riêng (BYPASSRLS), tách khỏi role ứng dụng: dựng lược đồ, nạp dữ liệu mẫu, sao lưu, phục hồi, dựng lại.
/// </summary>
public interface IDataMaintenance
{
    /// <summary>Áp lược đồ (idempotent) và nạp dữ liệu mẫu nếu database trống.</summary>
    void EnsureReady();
    /// <summary>Xuất toàn bộ dữ liệu mọi tenant (cùng định dạng file sao lưu).</summary>
    JsonObject Export();
    /// <summary>Thay toàn bộ dữ liệu bằng <paramref name="data"/>, giữ nguyên các collection trong <paramref name="keep"/> và kho bản chụp sao lưu.</summary>
    void Import(JsonObject data, IReadOnlyCollection<string> keep);
    /// <summary>Đặt lại về dữ liệu mẫu ban đầu (chỉ dùng khi phát triển).</summary>
    void Reset();
}

/// <summary>Nguồn dữ liệu mẫu <c>mock-data/*.json</c> — chỉ dùng để NẠP database trống và cho dataset của các hệ thống ngoài.</summary>
public interface IMockData
{
    JsonNode Load(string name);
    IEnumerable<string> Names { get; }
}
