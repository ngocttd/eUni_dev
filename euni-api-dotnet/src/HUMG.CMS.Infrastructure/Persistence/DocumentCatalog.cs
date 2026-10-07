using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>Phân loại collection: dùng chung (không RLS) hay theo tenant (RLS); cách lấy khóa dòng.</summary>
public static class DocumentCatalog
{
    public const string Meta = "_meta";
    public const string Settings = "settings";
    /// <summary>Dữ liệu toàn trường: tenant, danh bạ IdS, cây đơn vị, ngôn ngữ; danh sách sao lưu (bản chụp bao trùm mọi tenant).</summary>
    private static readonly HashSet<string> Global = new() { "languages", "users", "orgUnits", "tenants", "backups", Meta };

    public static bool IsGlobal(string collection) => Global.Contains(collection);
    public static string Table(string collection) => IsGlobal(collection) ? "cms_api.global_documents" : "cms_api.tenant_documents";

    /// <summary>Khóa dòng: <c>id</c> (số hoặc chuỗi) hoặc <c>code</c> với bảng danh mục.</summary>
    public static string KeyOf(string collection, JsonObject doc) =>
        Doc.AsString(doc.Get("id")) ?? Doc.AsString(doc.Get("code")) ?? throw new InvalidOperationException($"Bản ghi của {collection} thiếu id/code.");

    public static string TenantOf(string collection, JsonObject doc) =>
        doc.Str("tenantId") is { Length: > 0 } t ? t : throw new InvalidOperationException($"Bản ghi của {collection} thiếu tenantId (cần cho Row-Level Security).");
}
