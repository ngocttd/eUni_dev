using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using HUMG.CMS.Application.Abstractions;
using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Application.Features.SiteContent;
using HUMG.CMS.Domain.Common;

namespace HUMG.CMS.Application.Features.Settings;

/// <summary>Cấu hình website theo tenant (thông tin chung, SEO, ngôn ngữ, email, sao lưu…).</summary>
public sealed class SettingsService
{
    private readonly IDocumentStore _store;
    private readonly RequestContext _ctx;
    private readonly PublicSiteService _site;
    private readonly AuditService _audit;
    public SettingsService(IDocumentStore store, RequestContext ctx, PublicSiteService site, AuditService audit) { _store = store; _ctx = ctx; _site = site; _audit = audit; }

    public JsonObject All()
    {
        var o = _site.SettingsOf(_ctx.Tenant).Copy();
        o["i18nCoverage"] = _store.GetMeta("i18nCoverage")?.DeepClone();
        return o;
    }

    public JsonNode Group(string group) => _site.SettingsOf(_ctx.Tenant).Get(group)?.DeepClone() ?? throw HttpError.NotFound();

    /// <summary>Gửi email thử (mock: không gửi thật).</summary>
    public JsonObject TestEmail(JsonObject body)
    {
        var to = (Doc.Truthy(body.Get("to")) ? body.Str("to")! : "").Trim();
        if (!Regex.IsMatch(to, @"^[^@\s]+@[^@\s]+\.[^@\s]+$")) throw HttpError.Invalid("Email nhận không hợp lệ.");
        var mail = _site.SettingsOf(_ctx.Tenant).Get("email") as JsonObject;
        _audit.Log("settings.email_test", "settings", to);
        var host = Doc.Truthy(mail?.Get("smtpHost")) ? mail!.Str("smtpHost") : "SMTP";
        return new JsonObject { ["ok"] = true, ["message"] = $"Đã gửi email thử tới {to} (mock: qua {host})." };
    }

    public JsonObject Update(string group, JsonObject body)
    {
        var s = _site.SettingsOf(_ctx.Tenant);
        var before = s.Get(group) is JsonObject b ? b.Copy() : new JsonObject();
        s[group] = Doc.Merge(before, body);
        _store.MarkDirty();
        _audit.Log("settings.update", "settings", group, AuditService.Diff(before, (JsonObject)s[group]!));
        return ((JsonObject)s[group]!).Copy();
    }
}
