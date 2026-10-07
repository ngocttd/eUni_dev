using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Persistence.Relational;

/// <summary>Các collection chỉ cần bảng cha (không bản dịch/bảng con) và dữ liệu dùng chung.</summary>
public static class CoreMaps
{
    private static object Now() => TimeUtil.NowIso();
    private static Func<object> NowFn => Now;

    public static EntityMap Languages() => new TableMap("languages", "cms.languages", new[]
    {
        new Col("code", "code", CT.Text), new Col("label", "label", CT.Text, ""), new Col("flag", "flag", CT.Text),
        new Col("isSource", "is_source", CT.Bool, false), new Col("isEnabled", "is_enabled", CT.Bool, true),
    }, idColumn: "code", keyField: "code", identity: false, global: true, orderBy: "is_source DESC, code");

    public static EntityMap Users() => new TableMap("users", "cms.user_directory", new[]
    {
        new Col("sub", "sub", CT.Text), new Col("id", "legacy_id", CT.Int), new Col("username", "username", CT.Text), new Col("email", "email", CT.Text), new Col("fullName", "display_name", CT.Text, ""),
        new Col("roles", "roles", CT.TextArray, Array.Empty<string>()), new Col("tenants", "tenants", CT.TextArray, new[] { "humg" }), new Col("units", "units", CT.TextArray, Array.Empty<string>()),
        new Col("staffCode", "staff_code", CT.Text), new Col("studentCode", "student_code", CT.Text), new Col("status", "status", CT.Int, 1L),
        new Col("lastLoginAt", "last_seen_at", CT.Ts), new Col("createdAt", "created_at", CT.Ts, NowFn),
    }, idColumn: "sub", keyField: "sub", identity: false, global: true, orderBy: "legacy_id NULLS LAST, sub");

    public static EntityMap Grants() => new TableMap("grants", "cms.access_grants", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("principalType", "principal_type", CT.Text), new Col("principalId", "principal_id", CT.Text),
        new Col("resourceType", "resource_type", CT.Text, "*"), new Col("scopeType", "scope_type", CT.Text), new Col("scopeId", "scope_id", CT.Text),
        new Col("permissions", "permissions", CT.TextArray, Array.Empty<string>()), new Col("note", "note", CT.Text), new Col("expiresAt", "expires_at", CT.Ts),
        new Col("createdBy", "created_by", CT.Text, ""), new Col("createdAt", "created_at", CT.Ts, NowFn), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    });

    public static EntityMap Revisions() => new TableMap("revisions", "cms.revisions", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("entityType", "entity_type", CT.Text), new Col("entityId", "entity_id", CT.Int),
        new Col("version", "version", CT.Int, 1L), new Col("state", "state", CT.Text, "current"), new Col("snapshot", "snapshot", CT.Json, "{}"), new Col("reason", "reason", CT.Text),
        new Col("createdBy", "created_by", CT.Text, ""), new Col("createdAt", "created_at", CT.Ts, NowFn), new Col("reviewNote", "review_note", CT.Text),
    });

    public static EntityMap WorkflowHistory() => new TableMap("workflowHistory", "cms.workflow_history", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("entityType", "entity_type", CT.Text), new Col("entityId", "entity_id", CT.Int),
        new Col("action", "action", CT.Text), new Col("fromStatus", "from_status", CT.Enum, null, "cms.workflow_status"), new Col("toStatus", "to_status", CT.Enum, null, "cms.workflow_status"),
        new Col("note", "note", CT.Text), new Col("actorSub", "actor_sub", CT.Text, ""), new Col("actorName", "actor_name", CT.Text), new Col("at", "at", CT.Ts, NowFn),
    });

    /// <summary>Nhật ký audit (collection <c>activityLogs</c>) → bảng <c>audit_logs</c> chỉ ghi thêm, partition theo tháng.</summary>
    public sealed class AuditMap : TableMap
    {
        public AuditMap() : base("activityLogs", "cms.audit_logs", new[]
        {
            new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("createdAt", "at", CT.Ts, NowFn), new Col("actorSub", "actor_sub", CT.Text),
            new Col("userName", "actor_name", CT.Text), new Col("action", "action", CT.Text, ""), new Col("entityType", "entity_type", CT.Text), new Col("entityId", "entity_id", CT.Text),
            new Col("targetLabel", "entity_label", CT.Text), new Col("revisionVersion", "revision_version", CT.Int), new Col("changes", "changes", CT.Json),
            new Col("ipAddress", "ip", CT.Inet), new Col("userAgent", "user_agent", CT.Text),
        }, hasExtra: false) { }

        protected override void BeforeWrite(JsonObject doc)
        {
            doc["targetLabel"] = Trunc(doc.Str("targetLabel"), 500);
            if (doc.Str("userAgent") is { Length: > 500 } ua) doc["userAgent"] = ua[..500];
            if (doc.Str("action") is { Length: > 48 } a) doc["action"] = a[..48];
        }

        // PK (id, at): upsert theo (id, at) — bản ghi audit không bao giờ đổi `at`
        public override void Save(Db db, JsonNode node)
        {
            var doc = (JsonObject)node.DeepClone(); BeforeWrite(doc);
            var names = Cols.Select(c => c.Column).ToArray();
            var vals = Cols.Select((c, i) => c.Cast("@c" + i)).ToArray();
            var ps = Cols.Select((c, i) => ("@c" + i, c.ToDb(doc.Get(c.Field)))).ToArray();
            db.Exec($"INSERT INTO cms.audit_logs ({string.Join(", ", names)}) OVERRIDING SYSTEM VALUE VALUES ({string.Join(", ", vals)}) ON CONFLICT (id, at) DO NOTHING", ps);
        }
    }

    public static EntityMap Outbox() => new TableMap("outbox", "cms.outbox", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("type", "type", CT.Text, ""), new Col("payload", "payload", CT.Json, "{}"),
        new Col("availableAt", "available_at", CT.Ts, NowFn), new Col("processedAt", "processed_at", CT.Ts), new Col("attempts", "attempts", CT.Int, 0L), new Col("lastError", "last_error", CT.Text),
    });

    public static EntityMap Backups() => new TableMap("backups", "cms.backups", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("filePath", "file_path", CT.Text, ""), new Col("sizeBytes", "size_bytes", CT.Int, 0L),
        new Col("trigger", "trigger", CT.Text, "manual"), new Col("createdByName", "created_by_name", CT.Text), new Col("status", "status", CT.Text, "success"), new Col("createdAt", "created_at", CT.Ts, NowFn),
    }, global: true);

    /// <summary>Cây đơn vị: <c>path</c> (ltree) tính từ đơn vị cha khi ghi; cột is_active/synced_at do job đồng bộ quản lý.</summary>
    public sealed class OrgUnitMap : TableMap
    {
        public OrgUnitMap() : base("orgUnits", "cms.org_units", new[]
        {
            new Col("code", "code", CT.Text), new Col("name", "name", CT.Text, ""), new Col("kind", "kind", CT.Text, "office"), new Col("parentCode", "parent_code", CT.Text),
        }, idColumn: "code", keyField: "code", identity: false, global: true, hasExtra: false, orderBy: "path") { }

        public override void Save(Db db, JsonNode node)
        {
            var d = (JsonObject)node;
            var parent = Doc.Truthy(d.Get("parentCode")) ? d.Str("parentCode") : null;
            var label = System.Text.RegularExpressions.Regex.Replace(d.Str("code") ?? "", "[^A-Za-z0-9_]", "_");
            db.Exec(@"INSERT INTO cms.org_units (code, name, kind, parent_code, path) VALUES (@c, @n, @k, @p::text,
                        CASE WHEN @p::text IS NULL THEN text2ltree(@l::text) ELSE (SELECT path FROM cms.org_units WHERE code = @p::text) || text2ltree(@l::text) END)
                      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, kind = EXCLUDED.kind, parent_code = EXCLUDED.parent_code",
                ("@c", d.Str("code")), ("@n", d.Str("name") ?? ""), ("@k", d.Str("kind") ?? "office"), ("@p", parent), ("@l", label));
        }
    }

    /// <summary>Tenant + tên miền (bảng con tenant_domains).</summary>
    public sealed class TenantMap : TableMap
    {
        public TenantMap() : base("tenants", "cms.tenants", new[]
        {
            new Col("id", "id", CT.Text), new Col("name", "name", CT.Text, ""), new Col("rootUnit", "root_unit", CT.Text), new Col("isActive", "is_active", CT.Bool, true),
            new Col("createdAt", "created_at", CT.Ts, NowFn), new Col("createdBy", "created_by", CT.Text), new Col("updatedAt", "updated_at", CT.Ts), new Col("updatedBy", "updated_by", CT.Text),
        }, identity: false, global: true, orderBy: "(id = 'humg') DESC, created_at, id") { }

        protected override string[] ConsumedFields => new[] { "domains" };

        protected override void ReadChildren(Db db, List<JsonObject> docs)
        {
            var byId = docs.ToDictionary(d => d.Str("id")!);
            foreach (var d in docs) d["domains"] = new JsonArray();
            foreach (var r in db.Query("SELECT tenant_id, host FROM cms.tenant_domains ORDER BY is_primary DESC, host"))
                if (byId.TryGetValue((string)r[0]!, out var d)) ((JsonArray)d["domains"]!).Add((JsonNode?)JsonValue.Create((string)r[1]!));
        }

        protected override void WriteChildren(Db db, JsonObject doc)
        {
            var id = doc.Str("id");
            db.Exec("DELETE FROM cms.tenant_domains WHERE tenant_id = @t", ("@t", id));
            var first = true;
            foreach (var h in doc.Get("domains").Strings())
            {
                db.Exec("INSERT INTO cms.tenant_domains (host, tenant_id, is_primary) VALUES (@h, @t, @p)", ("@h", h), ("@t", id), ("@p", first));
                first = false;
            }
        }
    }

    public static EntityMap Media() => new MediaMap();

    /// <summary>Metadata file: file ở object storage (bucket + object_key); <c>url</c> công khai suy ra từ object_key.</summary>
    public sealed class MediaMap : TableMap
    {
        public const string UrlPrefix = "cms-api/uploads/";
        public MediaMap() : base("media", "cms.media", new[]
        {
            new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("bucket", "bucket", CT.Text, "cms-public", Hide: true), new Col("objectKey", "object_key", CT.Text, ""),
            new Col("fileName", "file_name", CT.Text, ""), new Col("kind", "kind", CT.Text, "other"), new Col("mimeType", "mime_type", CT.Text), new Col("sizeBytes", "size_bytes", CT.Int, 0L),
            new Col("altText", "alt_text", CT.Text), new Col("caption", "caption", CT.Text), new Col("folder", "folder", CT.Text), new Col("ownerUnitCode", "owner_unit_code", CT.Text),
            new Col("uploadedBy", "uploaded_by", CT.Text, ""), new Col("createdAt", "created_at", CT.Ts, NowFn), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
        }) { }

        protected override string[] ConsumedFields => new[] { "url" };

        protected override void BeforeWrite(JsonObject doc)
        {
            var url = doc.Str("url") ?? "";
            doc["objectKey"] = url.StartsWith(UrlPrefix) ? url[UrlPrefix.Length..] : url;
        }

        protected override void AfterRead(JsonObject doc)
        {
            var key = doc.Str("objectKey") ?? "";
            doc.Remove("objectKey");
            doc["url"] = UrlPrefix + key;
        }
    }
}
