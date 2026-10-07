using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Persistence.Relational;

/// <summary>Bản dịch trong tài liệu: <c>translations: { en: {...} }</c> ↔ các dòng trong bảng <c>*_translations</c> (ngôn ngữ gốc <c>vi</c> là trường chính của tài liệu).</summary>
internal static class Tr
{
    public static string Status(JsonObject t) => Doc.AsString(t.Get("status")) is "done" or "in_progress" or "missing" ? Doc.AsString(t.Get("status"))! : "done";
    public static IEnumerable<(string Lang, JsonObject T)> Others(JsonObject doc) =>
        doc.Get("translations") is JsonObject o ? o.Where(kv => kv.Key != "vi" && kv.Value is JsonObject).Select(kv => (kv.Key, (JsonObject)kv.Value!)) : Enumerable.Empty<(string, JsonObject)>();
    public static JsonObject Bag(JsonObject doc) { if (doc.Get("translations") is not JsonObject o) doc["translations"] = o = new JsonObject(); return o; }
    public static void Set(JsonObject o, string k, object? v) { if (v is not null and not DBNull) o[k] = Doc.J(v); }
}

public sealed class NewsMap : TableMap
{
    public NewsMap() : base("contents", "cms.news", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("categoryId", "category_id", CT.Int), new Col("ownerUnitCode", "owner_unit_code", CT.Text),
        new Col("status", "status", CT.Enum, "draft", "cms.workflow_status"), new Col("publishAt", "publish_at", CT.Ts), new Col("expireAt", "expire_at", CT.Ts), new Col("firstPublishedAt", "first_published_at", CT.Ts),
        new Col("isFeatured", "is_featured", CT.Bool, false), new Col("showOnHome", "show_on_home", CT.Bool, false), new Col("featuredImageId", "featured_image_id", CT.Int),
        new Col("tags", "tags", CT.TextArray, Array.Empty<string>()), new Col("source", "source", CT.Text), new Col("authorSub", "author_sub", CT.Text, ""), new Col("authorName", "author_display", CT.Text),
        new Col("viewCount", "view_count", CT.Int, 0L), new Col("submittedAt", "submitted_at", CT.Ts), new Col("submittedBy", "submitted_by", CT.Text), new Col("reviewedAt", "reviewed_at", CT.Ts),
        new Col("reviewedBy", "reviewed_by", CT.Text), new Col("reviewNote", "review_note", CT.Text), new Col("pendingRevisionId", "pending_revision_id", CT.Int), new Col("version", "version", CT.Int, 1L),
        new Col("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("createdBy", "created_by", CT.Text, ""), new Col("updatedAt", "updated_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())),
        new Col("updatedBy", "updated_by", CT.Text), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "title", "slug", "excerpt", "contentBody", "metaTitle", "metaDescription", "metaKeywords", "translations", "attachments" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["title"] = ""; d["translations"] = new JsonObject(); d["attachments"] = new JsonArray(); }
        foreach (var r in db.Query("SELECT news_id, lang, slug, title, excerpt, body_html, meta_title, meta_description, meta_keywords, translation_status::text FROM cms.news_translations ORDER BY news_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            var lang = (string)r[1]!;
            if (lang == "vi")
            {
                d["slug"] = r[2] as string; d["title"] = r[3] as string ?? ""; d["excerpt"] = r[4] as string; d["contentBody"] = r[5] as string;
                d["metaTitle"] = r[6] as string; d["metaDescription"] = r[7] as string; d["metaKeywords"] = r[8] as string;
            }
            else
            {
                var t = new JsonObject();
                if (r[3] is string { Length: > 0 } title) t["title"] = title;
                Tr.Set(t, "excerpt", r[4]); Tr.Set(t, "contentBody", r[5]); Tr.Set(t, "metaTitle", r[6]); Tr.Set(t, "metaDescription", r[7]); Tr.Set(t, "metaKeywords", r[8]);
                t["status"] = r[9] as string;
                ((JsonObject)d["translations"]!)[lang] = t;
            }
        }
        foreach (var r in db.Query("SELECT news_id, title, meta, url, extra::text FROM cms.news_attachments ORDER BY news_id, sort_order, id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d))
            {
                var a = new JsonObject { ["title"] = r[1] as string, ["meta"] = r[2] as string, ["url"] = r[3] as string };
                if (r[4] is string ex && JsonNode.Parse(ex) is JsonObject eo) foreach (var kv in eo) a[kv.Key] = kv.Value?.DeepClone();
                ((JsonArray)d["attachments"]!).Add(a);
            }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id"); var tenant = doc.Str("tenantId");
        db.Exec("DELETE FROM cms.news_translations WHERE news_id = @i", ("@i", id));
        db.Exec("DELETE FROM cms.news_attachments WHERE news_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.news_translations (news_id, lang, tenant_id, slug, title, excerpt, body_html, body_text, meta_title, meta_description, meta_keywords, translation_status) VALUES (@i, @l, @t, @s, @ti, @e, @b, @bt, @mt, @md, @mk, @st::cms.translation_status)";
        var slug = doc.Str("slug") ?? "";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@t", tenant), ("@s", slug), ("@ti", doc.Str("title") ?? ""), ("@e", doc.Str("excerpt")), ("@b", doc.Str("contentBody")), ("@bt", Strip(doc.Str("contentBody"))),
            ("@mt", doc.Str("metaTitle")), ("@md", doc.Str("metaDescription")), ("@mk", doc.Str("metaKeywords")), ("@st", "done"));
        foreach (var (lang, t) in Tr.Others(doc))
            db.Exec(ins, ("@i", id), ("@l", lang), ("@t", tenant), ("@s", slug), ("@ti", t.Str("title") ?? ""), ("@e", t.Str("excerpt")), ("@b", t.Str("contentBody")), ("@bt", Strip(t.Str("contentBody"))),
                ("@mt", t.Str("metaTitle")), ("@md", t.Str("metaDescription")), ("@mk", t.Str("metaKeywords")), ("@st", Tr.Status(t)));
        var order = 0;
        foreach (var a in doc.Get("attachments").Objects())
        {
            var extra = new JsonObject(); foreach (var kv in a) if (kv.Key is not ("title" or "meta" or "url")) extra[kv.Key] = kv.Value?.DeepClone();
            db.Exec("INSERT INTO cms.news_attachments (news_id, title, meta, url, sort_order, extra) VALUES (@i, @t, @m, @u, @o, @x::jsonb)",
                ("@i", id), ("@t", Trunc(a.Str("title"), 255)), ("@m", a.Str("meta")), ("@u", a.Str("url")), ("@o", order++), ("@x", Doc.Stringify(extra)));
        }
    }
}

public sealed class AnnouncementMap : TableMap
{
    public AnnouncementMap() : base("announcements", "cms.announcements", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("ownerUnitCode", "owner_unit_code", CT.Text, "HUMG"), new Col("category", "category", CT.Text, "general"),
        new Col("priority", "priority", CT.Int, 0L), new Col("status", "status", CT.Enum, "draft", "cms.workflow_status"), new Col("publishAt", "publish_at", CT.Ts), new Col("expireAt", "expire_at", CT.Ts),
        new Col("firstPublishedAt", "first_published_at", CT.Ts), new Col("pinnedUntil", "pinned_until", CT.Ts), new Col("requireAck", "require_ack", CT.Bool, false),
        new Col("channels", "channels", CT.TextArray, new[] { "portal" }), new Col("recallReason", "recall_reason", CT.Text), new Col("recipientCount", "recipient_count", CT.Int), new Col("authorSub", "author_sub", CT.Text, ""), new Col("authorName", "author_display", CT.Text),
        new Col("submittedAt", "submitted_at", CT.Ts), new Col("submittedBy", "submitted_by", CT.Text), new Col("reviewedAt", "reviewed_at", CT.Ts), new Col("reviewedBy", "reviewed_by", CT.Text),
        new Col("reviewNote", "review_note", CT.Text), new Col("pendingRevisionId", "pending_revision_id", CT.Int), new Col("version", "version", CT.Int, 1L),
        new Col("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("createdBy", "created_by", CT.Text, ""), new Col("updatedAt", "updated_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())),
        new Col("updatedBy", "updated_by", CT.Text), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "title", "bodyHtml", "translations", "targets", "attachments" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["title"] = ""; d["bodyHtml"] = ""; d["translations"] = new JsonObject(); d["targets"] = new JsonArray(); d["attachments"] = new JsonArray(); }
        foreach (var r in db.Query("SELECT announcement_id, lang, title, body_html, translation_status::text FROM cms.announcement_translations ORDER BY announcement_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            if ((string)r[1]! == "vi") { d["title"] = r[2] as string ?? ""; d["bodyHtml"] = r[3] as string ?? ""; }
            else
            {
                var t = new JsonObject();
                if (r[2] is string { Length: > 0 } title) t["title"] = title;
                Tr.Set(t, "bodyHtml", r[3]); t["status"] = r[4] as string;
                ((JsonObject)d["translations"]!)[(string)r[1]!] = t;
            }
        }
        foreach (var r in db.Query("SELECT announcement_id, audience, unit_code, user_sub, is_exclude, label FROM cms.announcement_targets ORDER BY announcement_id, id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d))
                ((JsonArray)d["targets"]!).Add(new JsonObject { ["audience"] = r[1] as string, ["unitCode"] = r[2] as string, ["userSub"] = r[3] as string, ["isExclude"] = (bool)r[4]!, ["label"] = r[5] as string });
        foreach (var r in db.Query("SELECT announcement_id, title, meta, extra::text FROM cms.announcement_attachments ORDER BY announcement_id, sort_order, id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d))
            {
                var a = new JsonObject { ["title"] = r[1] as string, ["meta"] = r[2] as string };
                if (r[3] is string ex && JsonNode.Parse(ex) is JsonObject eo) foreach (var kv in eo) a[kv.Key] = kv.Value?.DeepClone();
                ((JsonArray)d["attachments"]!).Add(a);
            }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        foreach (var t in new[] { "announcement_translations", "announcement_targets", "announcement_attachments" }) db.Exec($"DELETE FROM cms.{t} WHERE announcement_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.announcement_translations (announcement_id, lang, title, body_html, body_text, translation_status) VALUES (@i, @l, @t, @b, @bt, @st::cms.translation_status)";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@t", doc.Str("title") ?? ""), ("@b", doc.Str("bodyHtml")), ("@bt", Strip(doc.Str("bodyHtml"))), ("@st", "done"));
        foreach (var (lang, t) in Tr.Others(doc)) db.Exec(ins, ("@i", id), ("@l", lang), ("@t", t.Str("title") ?? ""), ("@b", t.Str("bodyHtml")), ("@bt", Strip(t.Str("bodyHtml"))), ("@st", Tr.Status(t)));
        foreach (var t in doc.Get("targets").Objects())
            db.Exec("INSERT INTO cms.announcement_targets (announcement_id, audience, unit_code, user_sub, is_exclude, label) VALUES (@i, @a, @u, @s, @x, @l)",
                ("@i", id), ("@a", Doc.Truthy(t.Get("audience")) ? t.Str("audience") : null), ("@u", Doc.Truthy(t.Get("unitCode")) ? t.Str("unitCode") : null),
                ("@s", Doc.Truthy(t.Get("userSub")) ? t.Str("userSub") : null), ("@x", Doc.Truthy(t.Get("isExclude"))), ("@l", Trunc(t.Str("label"), 255)));
        var order = 0;
        foreach (var a in doc.Get("attachments").Objects())
        {
            var extra = new JsonObject(); foreach (var kv in a) if (kv.Key is not ("title" or "meta")) extra[kv.Key] = kv.Value?.DeepClone();
            db.Exec("INSERT INTO cms.announcement_attachments (announcement_id, title, meta, sort_order, extra) VALUES (@i, @t, @m, @o, @x::jsonb)",
                ("@i", id), ("@t", Trunc(a.Str("title"), 255)), ("@m", a.Str("meta")), ("@o", order++), ("@x", Doc.Stringify(extra)));
        }
    }
}

/// <summary>Biên nhận đọc/xác nhận thông báo: tenant lấy từ thông báo cha (không nhân đôi cột tenant).</summary>
public sealed class ReceiptMap : TableMap
{
    public ReceiptMap() : base("receipts", "cms.announcement_receipts", new[]
    {
        new Col("id", "id", CT.Int), new Col("announcementId", "announcement_id", CT.Int), new Col("userSub", "user_sub", CT.Text, ""), new Col("deliveredAt", "delivered_at", CT.Ts),
        new Col("readAt", "read_at", CT.Ts), new Col("ackedAt", "acked_at", CT.Ts),
    }, hasExtra: false) { }

    public override List<Loaded> Load(Db db)
    {
        var rows = db.Query(@"SELECT r.id, r.announcement_id, r.user_sub,
                to_char(r.delivered_at AT TIME ZONE 'UTC', 'YYYY-MM-DD""T""HH24:MI:SS.MS""Z""'), to_char(r.read_at AT TIME ZONE 'UTC', 'YYYY-MM-DD""T""HH24:MI:SS.MS""Z""'),
                to_char(r.acked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD""T""HH24:MI:SS.MS""Z""'), a.tenant_id
            FROM cms.announcement_receipts r JOIN cms.announcements a ON a.id = r.announcement_id ORDER BY r.id");
        return rows.Select(r => new Loaded(Convert.ToInt64(r[0]).ToString(), new JsonObject
        {
            ["id"] = Convert.ToInt64(r[0]), ["tenantId"] = r[6] as string, ["announcementId"] = Convert.ToInt64(r[1]), ["userSub"] = r[2] as string,
            ["deliveredAt"] = r[3] as string, ["readAt"] = r[4] as string, ["ackedAt"] = r[5] as string,
        }, r[6] as string)).ToList();
    }

    public override void Save(Db db, JsonNode node)
    {
        var d = (JsonObject)node;
        db.Exec(@"INSERT INTO cms.announcement_receipts (id, announcement_id, user_sub, delivered_at, read_at, acked_at) OVERRIDING SYSTEM VALUE
                  VALUES (@i, @a, @u, @d::timestamptz, @r::timestamptz, @k::timestamptz)
                  ON CONFLICT (announcement_id, user_sub) DO UPDATE SET delivered_at = EXCLUDED.delivered_at, read_at = EXCLUDED.read_at, acked_at = EXCLUDED.acked_at",
            ("@i", d.Long("id")), ("@a", d.Long("announcementId")), ("@u", d.Str("userSub")), ("@d", Doc.Truthy(d.Get("deliveredAt")) ? d.Str("deliveredAt") : null),
            ("@r", Doc.Truthy(d.Get("readAt")) ? d.Str("readAt") : null), ("@k", Doc.Truthy(d.Get("ackedAt")) ? d.Str("ackedAt") : null));
    }
}

public sealed class CategoryMap : TableMap
{
    public CategoryMap() : base("categories", "cms.categories", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("parentId", "parent_id", CT.Int), new Col("sortOrder", "sort_order", CT.Int, 0L), new Col("isActive", "is_active", CT.Bool, true),
        new Col("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("updatedAt", "updated_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())),
        new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "name", "slug", "description", "translations" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["name"] = ""; d["slug"] = ""; d["translations"] = new JsonObject(); }
        foreach (var r in db.Query("SELECT category_id, lang, name, slug, description FROM cms.category_translations ORDER BY category_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            if ((string)r[1]! == "vi") { d["name"] = r[2] as string ?? ""; d["slug"] = r[3] as string ?? ""; d["description"] = r[4] as string; }
            else ((JsonObject)d["translations"]!)[(string)r[1]!] = new JsonObject { ["name"] = r[2] as string, ["slug"] = r[3] as string, ["description"] = r[4] as string };
        }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.category_translations WHERE category_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.category_translations (category_id, lang, tenant_id, name, slug, description) VALUES (@i, @l, @t, @n, @s, @d)";
        var name = doc.Str("name") ?? ""; var slug = doc.Str("slug") ?? "";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@t", doc.Str("tenantId")), ("@n", name), ("@s", slug), ("@d", doc.Str("description")));
        foreach (var (lang, t) in Tr.Others(doc))
            db.Exec(ins, ("@i", id), ("@l", lang), ("@t", doc.Str("tenantId")), ("@n", t.Str("name") ?? name), ("@s", t.Str("slug") ?? slug), ("@d", t.Str("description")));
    }
}

public sealed class PageMap : TableMap
{
    public PageMap() : base("pages", "cms.pages", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("parentId", "parent_id", CT.Int), new Col("template", "template", CT.Text, "default"), new Col("path", "path", CT.Text),
        new Col("status", "status", CT.Enum, "published", "cms.workflow_status"), new Col("sortOrder", "sort_order", CT.Int, 0L),
        new Col("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("updatedAt", "updated_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())),
        new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "slug", "title", "bodyHtml", "translations" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["slug"] = ""; d["title"] = ""; d["translations"] = new JsonObject(); }
        foreach (var r in db.Query("SELECT page_id, lang, slug, title, body_html, translation_status::text FROM cms.page_translations ORDER BY page_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            if ((string)r[1]! == "vi") { d["slug"] = r[2] as string ?? ""; d["title"] = r[3] as string ?? ""; d["bodyHtml"] = r[4] as string ?? ""; }
            else
            {
                var t = new JsonObject();
                if (r[3] is string { Length: > 0 } title) t["title"] = title;
                Tr.Set(t, "bodyHtml", r[4]); t["status"] = r[5] as string;
                ((JsonObject)d["translations"]!)[(string)r[1]!] = t;
            }
        }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.page_translations WHERE page_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.page_translations (page_id, lang, tenant_id, slug, title, body_html, translation_status) VALUES (@i, @l, @t, @s, @ti, @b, @st::cms.translation_status)";
        var slug = doc.Str("slug") ?? "";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@t", doc.Str("tenantId")), ("@s", slug), ("@ti", doc.Str("title") ?? ""), ("@b", doc.Str("bodyHtml")), ("@st", "done"));
        foreach (var (lang, t) in Tr.Others(doc))
            db.Exec(ins, ("@i", id), ("@l", lang), ("@t", doc.Str("tenantId")), ("@s", slug), ("@ti", t.Str("title") ?? ""), ("@b", t.Str("bodyHtml")), ("@st", Tr.Status(t)));
    }
}

public sealed class MenuItemMap : TableMap
{
    public MenuItemMap() : base("menuItems", "cms.menu_items", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("groupCode", "group_code", CT.Text, "header"), new Col("parentId", "parent_id", CT.Int), new Col("type", "type", CT.Text, "page"),
        new Col("url", "url", CT.Text), new Col("icon", "icon", CT.Text), new Col("sortOrder", "sort_order", CT.Int, 0L), new Col("isVisible", "is_visible", CT.Bool, true), new Col("openInNewTab", "open_in_new_tab", CT.Bool, false),
        new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "label", "translations" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["label"] = ""; d["translations"] = new JsonObject(); }
        foreach (var r in db.Query("SELECT menu_item_id, lang, label, translation_status::text FROM cms.menu_item_translations ORDER BY menu_item_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            if ((string)r[1]! == "vi") d["label"] = r[2] as string ?? "";
            else ((JsonObject)d["translations"]!)[(string)r[1]!] = new JsonObject { ["label"] = r[2] as string, ["status"] = r[3] as string };
        }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.menu_item_translations WHERE menu_item_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.menu_item_translations (menu_item_id, lang, label, translation_status) VALUES (@i, @l, @b, @st::cms.translation_status)";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@b", Trunc(doc.Str("label"), 190)), ("@st", "done"));
        foreach (var (lang, t) in Tr.Others(doc)) db.Exec(ins, ("@i", id), ("@l", lang), ("@b", Trunc(t.Str("label"), 190)), ("@st", Tr.Status(t)));
    }
}

public sealed class BannerMap : TableMap
{
    public BannerMap() : base("banners", "cms.banners", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("position", "position", CT.Text, "home_slider"), new Col("imageId", "image_id", CT.Int), new Col("linkUrl", "link_url", CT.Text),
        new Col("isVisible", "is_visible", CT.Bool, true), new Col("sortOrder", "sort_order", CT.Int, 0L), new Col("startsOn", "starts_on", CT.Date), new Col("endsOn", "ends_on", CT.Date),
        new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "title", "subtitle", "translations" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) { d["title"] = ""; d["subtitle"] = null; d["translations"] = new JsonObject(); }
        foreach (var r in db.Query("SELECT banner_id, lang, title, subtitle FROM cms.banner_translations ORDER BY banner_id, lang"))
        {
            if (!byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) continue;
            if ((string)r[1]! == "vi") { d["title"] = r[2] as string ?? ""; d["subtitle"] = r[3] as string; }
            else ((JsonObject)d["translations"]!)[(string)r[1]!] = new JsonObject { ["title"] = r[2] as string, ["subtitle"] = r[3] as string };
        }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.banner_translations WHERE banner_id = @i", ("@i", id));
        const string ins = "INSERT INTO cms.banner_translations (banner_id, lang, title, subtitle) VALUES (@i, @l, @t, @s)";
        db.Exec(ins, ("@i", id), ("@l", "vi"), ("@t", Trunc(doc.Str("title"), 255)), ("@s", Doc.Truthy(doc.Get("subtitle")) ? Trunc(doc.Str("subtitle"), 400) : null));
        foreach (var (lang, t) in Tr.Others(doc)) db.Exec(ins, ("@i", id), ("@l", lang), ("@t", Trunc(t.Str("title"), 255)), ("@s", t.Str("subtitle")));
    }
}

public sealed class EventMap : TableMap
{
    public EventMap() : base("events", "cms.events", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("slug", "slug", CT.Text, ""), new Col("startsAt", "starts_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("endsAt", "ends_at", CT.Ts),
        new Col("status", "status", CT.Text, "upcoming"), new Col("contact", "contact", CT.Text), new Col("thumbnailId", "thumbnail_id", CT.Int), new Col("ownerUnitCode", "owner_unit_code", CT.Text),
        new Col("isVisible", "is_visible", CT.Bool, true), new Col("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("createdBy", "created_by", CT.Text),
        new Col("updatedAt", "updated_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new Col("updatedBy", "updated_by", CT.Text), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }) { }

    protected override string[] ConsumedFields => new[] { "title", "place", "placeFull", "organizer", "audience", "description", "agenda" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) d["title"] = "";
        foreach (var r in db.Query("SELECT event_id, title, place, place_full, organizer, audience, description::text, agenda::text FROM cms.event_translations WHERE lang = 'vi' ORDER BY event_id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d))
            {
                d["title"] = r[1] as string ?? ""; d["place"] = r[2] as string; d["placeFull"] = r[3] as string; d["organizer"] = r[4] as string; d["audience"] = r[5] as string;
                d["description"] = JsonNode.Parse((string)r[6]!); d["agenda"] = JsonNode.Parse((string)r[7]!);
            }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.event_translations WHERE event_id = @i", ("@i", id));
        db.Exec("INSERT INTO cms.event_translations (event_id, lang, title, place, place_full, organizer, audience, description, agenda) VALUES (@i, 'vi', @t, @p, @pf, @o, @a, @d::jsonb, @g::jsonb)",
            ("@i", id), ("@t", Trunc(doc.Str("title"), 400)), ("@p", doc.Str("place")), ("@pf", doc.Str("placeFull")), ("@o", doc.Str("organizer")), ("@a", doc.Str("audience")),
            ("@d", Doc.Stringify(doc.Get("description") ?? new JsonArray())), ("@g", Doc.Stringify(doc.Get("agenda") ?? new JsonArray())));
    }
}

/// <summary>Album / video / podcast dùng chung bảng media_items (kind) — phần riêng của từng loại nằm trong cột <c>data</c>.</summary>
public sealed class MediaItemMap : TableMap
{
    public MediaItemMap(string collection, string kind, bool hasViewCount) : base(collection, "cms.media_items", Columns(kind, hasViewCount), kindColumn: "kind", kindValue: kind, remap: true, extraColumn: "data") { }

    private static Col[] Columns(string kind, bool viewCount)
    {
        var cols = new List<Col>
        {
            new("id", "id", CT.Int), new("tenantId", "tenant_id", CT.Text), new("slug", "slug", CT.Text, ""), new("publishedAt", "published_on", CT.Date), new("isVisible", "is_visible", CT.Bool, true),
            new("createdAt", "created_at", CT.Ts, (Func<object>)(() => TimeUtil.NowIso())), new("deletedAt", "deleted_at", CT.Ts), new("deletedBy", "deleted_by", CT.Text),
        };
        if (viewCount) cols.Add(new Col("viewCount", "view_count", CT.Int, 0L));
        return cols.ToArray();
    }

    protected override string[] ConsumedFields => new[] { "title", "description" };

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var d in docs) d["title"] = "";
        foreach (var r in db.Query("SELECT media_item_id, title, description FROM cms.media_item_translations WHERE lang = 'vi' ORDER BY media_item_id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d)) { d["title"] = r[1] as string ?? ""; if (r[2] is string desc) d["description"] = desc; }
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.media_item_translations WHERE media_item_id = @i", ("@i", id));
        db.Exec("INSERT INTO cms.media_item_translations (media_item_id, lang, title, description) VALUES (@i, 'vi', @t, @d)", ("@i", id), ("@t", Trunc(doc.Str("title"), 400)), ("@d", doc.Str("description")));
    }
}

/// <summary>Khối trang chủ (hero, lối tắt, nhóm đối tượng, thế mạnh, đối tác, chỉ số) dùng chung bảng home_blocks: trường cần dịch → bản dịch, còn lại → data.</summary>
public sealed class HomeBlockMap : TableMap
{
    private readonly string[] _kinds, _translatable;
    public HomeBlockMap(string collection, string[] kinds, string[] translatable) : base(collection, "cms.home_blocks", new[]
    {
        new Col("id", "id", CT.Int), new Col("tenantId", "tenant_id", CT.Text), new Col("_kind", "kind", CT.Text, kinds[0]), new Col("isVisible", "is_visible", CT.Bool, true),
        new Col("sortOrder", "sort_order", CT.Int, 0L), new Col("deletedAt", "deleted_at", CT.Ts), new Col("deletedBy", "deleted_by", CT.Text),
    }, remap: true, extraColumn: "data") { _kinds = kinds; _translatable = translatable; }

    protected override string[] ConsumedFields => _translatable;
    protected override string SelectSql(string columns) => $"SELECT {columns} FROM cms.home_blocks WHERE kind IN ({string.Join(",", _kinds.Select(k => $"'{k}'"))}) ORDER BY id";
    public override void DeleteAll(Db db) => db.Exec($"DELETE FROM cms.home_blocks WHERE kind IN ({string.Join(",", _kinds.Select(k => $"'{k}'"))})");

    protected override void BeforeWrite(JsonObject doc) =>
        doc["_kind"] = _kinds.Length == 1 ? _kinds[0] : doc.Str("placement") == "about" ? "stat_about" : "stat_hero";

    protected override void AfterRead(JsonObject doc)
    {
        var kind = doc.Str("_kind"); doc.Remove("_kind");
        if (_kinds.Length > 1) doc["placement"] = kind == "stat_about" ? "about" : "hero";
    }

    protected override void ReadChildren(Db db, List<JsonObject> docs)
    {
        var byId = docs.ToDictionary(d => d.Long("id")!.Value);
        foreach (var r in db.Query("SELECT block_id, data::text FROM cms.home_block_translations WHERE lang = 'vi' ORDER BY block_id"))
            if (byId.TryGetValue(Convert.ToInt64(r[0]), out var d) && JsonNode.Parse((string)r[1]!) is JsonObject t) foreach (var kv in t) d[kv.Key] = kv.Value?.DeepClone();
    }

    protected override void WriteChildren(Db db, JsonObject doc)
    {
        var id = doc.Long("id");
        db.Exec("DELETE FROM cms.home_block_translations WHERE block_id = @i", ("@i", id));
        var t = new JsonObject(); foreach (var f in _translatable) if (doc.Has(f)) t[f] = doc.Get(f)?.DeepClone();
        db.Exec("INSERT INTO cms.home_block_translations (block_id, lang, data) VALUES (@i, 'vi', @d::jsonb)", ("@i", id), ("@d", Doc.Stringify(t)));
    }
}
