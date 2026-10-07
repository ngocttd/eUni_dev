using HUMG.CMS.Application.Common;
using HUMG.CMS.Application.Features;
using HUMG.CMS.Application.Features.AccessControl;
using HUMG.CMS.Application.Features.Announcements;
using HUMG.CMS.Application.Features.Audit;
using HUMG.CMS.Application.Features.Auth;
using HUMG.CMS.Application.Features.Backups;
using HUMG.CMS.Application.Features.Content;
using HUMG.CMS.Application.Features.Datasets;
using HUMG.CMS.Application.Features.Media;
using HUMG.CMS.Application.Features.Publishing;
using HUMG.CMS.Application.Features.Settings;
using HUMG.CMS.Application.Features.SiteContent;
using HUMG.CMS.Application.Features.Tenants;
using Microsoft.Extensions.DependencyInjection;

namespace HUMG.CMS.Application;

public static class DependencyInjection
{
    /// <summary>Đăng ký use case (scoped theo request). Cần <c>IDocumentStore</c>, <c>ITokenService</c>, <c>IFileStorage</c>, <c>IMockData</c> từ Infrastructure.</summary>
    public static IServiceCollection AddApplication(this IServiceCollection s)
    {
        s.AddScoped<RequestContext>();
        s.AddScoped<AccessService>(); s.AddScoped<AuthorizationService>(); s.AddScoped<GrantService>();
        s.AddScoped<AuditService>(); s.AddScoped<AuthService>(); s.AddScoped<TenantService>();
        s.AddScoped<WorkflowService>(); s.AddScoped<NewsProfile>(); s.AddScoped<AnnouncementProfile>(); s.AddScoped<AnnouncementService>();
        s.AddScoped<PublicSiteService>(); s.AddScoped<ResourceCrudService>();
        s.AddScoped<DirectoryService>(); s.AddScoped<UserContextService>(); s.AddScoped<DashboardService>();
        s.AddScoped<MediaService>(); s.AddScoped<SettingsService>(); s.AddScoped<BackupService>();
        s.AddSingleton<DatasetService>();
        return s;
    }
}
