using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Infrastructure.Persistence.Relational;

namespace HUMG.CMS.Infrastructure.Persistence;

/// <summary>Tra cứu ánh xạ collection → bảng; khóa dòng và tenant của tài liệu.</summary>
public static class DocumentCatalog
{
    public const string Meta = "_meta";
    public const string Settings = "settings";

    public static EntityMap Map(string collection) => MapRegistry.For(collection);
    public static bool IsGlobal(string collection) => Map(collection).Global;

    /// <summary>Khóa dòng: <c>id</c> (số hoặc chuỗi) hoặc <c>code</c>/<c>sub</c> với bảng danh mục.</summary>
    public static string KeyOf(string collection, JsonObject doc) =>
        Doc.AsString(doc.Get(Map(collection) is TableMap t ? t.KeyField : "id")) ?? Doc.AsString(doc.Get("id")) ?? Doc.AsString(doc.Get("code")) ?? throw new InvalidOperationException($"Bản ghi của {collection} thiếu khóa.");

    public static string TenantOf(string collection, JsonObject doc) =>
        doc.Str("tenantId") is { Length: > 0 } t ? t : throw new InvalidOperationException($"Bản ghi của {collection} thiếu tenantId (cần cho Row-Level Security).");
}
