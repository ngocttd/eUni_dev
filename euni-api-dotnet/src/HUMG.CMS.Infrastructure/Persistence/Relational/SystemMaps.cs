using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Infrastructure.Persistence.Relational;

/// <summary>Cấu hình theo tenant: mỗi nhóm (general, seo, email, language, backup, home…) là một dòng của <c>cms.settings</c>; tài liệu = object các nhóm.</summary>
public sealed class SettingsMap : EntityMap
{
    public override string Collection => DocumentCatalog.Settings;

    public override List<Loaded> Load(Db db)
    {
        var docs = new Dictionary<string, JsonObject>(); var order = new List<string>();
        foreach (var r in db.Query("SELECT tenant_id, group_key, value::text FROM cms.settings ORDER BY tenant_id, group_key"))
        {
            var t = (string)r[0]!;
            if (!docs.TryGetValue(t, out var d)) { docs[t] = d = new JsonObject(); order.Add(t); }
            d[(string)r[1]!] = JsonNode.Parse((string)r[2]!);
        }
        return order.Select(t => new Loaded(t, docs[t], t)).ToList();
    }

    public override void Save(Db db, JsonNode node)
    {
        throw new InvalidOperationException("SettingsMap.Save cần khóa tenant — dùng Save(db, tenant, doc).");
    }

    public void Save(Db db, string tenant, JsonObject doc)
    {
        var keep = new List<string>();
        foreach (var kv in doc)
        {
            keep.Add(kv.Key);
            db.Exec("INSERT INTO cms.settings (tenant_id, group_key, value) VALUES (@t, @g, @v::jsonb) ON CONFLICT (tenant_id, group_key) DO UPDATE SET value = EXCLUDED.value",
                ("@t", tenant), ("@g", kv.Key), ("@v", Doc.Stringify(kv.Value)));
        }
        db.Exec("DELETE FROM cms.settings WHERE tenant_id = @t AND group_key <> ALL(@k)", ("@t", tenant), ("@k", keep.ToArray()));
    }

    public override void Delete(Db db, JsonNode doc) => throw new NotSupportedException();
    public void Delete(Db db, string tenant) => db.Exec("DELETE FROM cms.settings WHERE tenant_id = @t", ("@t", tenant));
    public override void DeleteAll(Db db) => db.Exec("DELETE FROM cms.settings");
}

/// <summary>Metadata dùng chung (i18nCoverage, trend, searchPages, menuGroups, defaultSettings, schemaVersion, snapshots).</summary>
public sealed class MetaMap : EntityMap
{
    public override string Collection => DocumentCatalog.Meta;
    public override bool Global => true;

    public override List<Loaded> Load(Db db) =>
        db.Query("SELECT key, value::text FROM cms.app_meta ORDER BY key").Select(r => new Loaded((string)r[0]!, JsonNode.Parse((string)r[1]!)!, null)).ToList();

    public override void Save(Db db, JsonNode doc) => throw new InvalidOperationException("MetaMap cần khóa — dùng Save(db, key, value).");
    public void Save(Db db, string key, JsonNode value) =>
        db.Exec("INSERT INTO cms.app_meta (key, value) VALUES (@k, @v::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", ("@k", key), ("@v", Doc.Stringify(value)));
    public override void Delete(Db db, JsonNode doc) => throw new NotSupportedException();
    public void Delete(Db db, string key) => db.Exec("DELETE FROM cms.app_meta WHERE key = @k", ("@k", key));
    public override void DeleteAll(Db db) => db.Exec("DELETE FROM cms.app_meta WHERE key <> 'snapshots'");
}

/// <summary>Danh mục các ánh xạ collection → bảng quan hệ.</summary>
public static class MapRegistry
{
    public static readonly IReadOnlyDictionary<string, EntityMap> All = Build();

    private static Dictionary<string, EntityMap> Build()
    {
        var list = new List<EntityMap>
        {
            CoreMaps.Languages(), new CoreMaps.TenantMap(), new CoreMaps.OrgUnitMap(), CoreMaps.Users(), CoreMaps.Grants(),
            new CategoryMap(), CoreMaps.Media(), new NewsMap(), new AnnouncementMap(), new ReceiptMap(),
            CoreMaps.Revisions(), CoreMaps.WorkflowHistory(), new CoreMaps.AuditMap(), CoreMaps.Outbox(), CoreMaps.Backups(),
            new EventMap(), new MediaItemMap("albums", "album", false), new MediaItemMap("videos", "video", true), new MediaItemMap("podcasts", "podcast", false),
            new PageMap(), new MenuItemMap(), new BannerMap(),
            new HomeBlockMap("heroSlides", new[] { "hero_slide" }, new[] { "kicker", "title", "subtitle", "motto", "primaryLabel", "accentLabel" }),
            new HomeBlockMap("quickLinks", new[] { "quick_link" }, new[] { "label" }),
            new HomeBlockMap("audiences", new[] { "audience" }, new[] { "title", "description" }),
            new HomeBlockMap("strengths", new[] { "strength" }, new[] { "title", "text" }),
            new HomeBlockMap("partners", new[] { "partner" }, new[] { "name" }),
            new HomeBlockMap("siteStats", new[] { "stat_hero", "stat_about" }, new[] { "label", "sub" }),
            new SettingsMap(), new MetaMap(),
        };
        return list.ToDictionary(m => m.Collection);
    }

    public static EntityMap For(string collection) =>
        All.TryGetValue(collection, out var m) ? m : throw new InvalidOperationException($"Collection \"{collection}\" chưa có ánh xạ sang lược đồ v2.");
}
