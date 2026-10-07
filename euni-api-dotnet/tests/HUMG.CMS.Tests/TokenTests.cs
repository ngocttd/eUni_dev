using HUMG.CMS.Infrastructure.Security;
using Xunit;

namespace HUMG.CMS.Tests;

public class TokenTests
{
    private static IReadOnlyDictionary<string, object?> Claims() => new Dictionary<string, object?>
    {
        ["sub"] = "u-nthoa", ["name"] = "Nguyễn Thị Hoa", ["email"] = "nthoa@humg.edu.vn", ["role"] = "cms-editor", ["roles"] = new[] { "cms.editor", "staff" },
        ["perms"] = new[] { "cms.access", "news.view" }, ["tenants"] = new[] { "humg" }, ["units"] = new[] { "P-TT" }, ["staff_code"] = "CB0002", ["student_code"] = null,
    };

    [Fact]
    public void Phat_hanh_roi_doc_lai_du_claim()
    {
        var svc = new Hs256TokenService("secret-test-key-123", "8h");
        var u = svc.Read("Bearer " + svc.Issue(Claims()))!;
        Assert.Equal("u-nthoa", u.Sub); Assert.Equal("Nguyễn Thị Hoa", u.Name);
        Assert.Contains("cms.editor", u.Roles); Assert.Contains("news.view", u.Perms); Assert.Equal("CB0002", u.StaffCode); Assert.Null(u.StudentCode);
    }

    [Fact] public void Sai_chu_ky_hoac_sai_khoa_bi_tu_choi()
    {
        var a = new Hs256TokenService("khoa-A-khoa-A-khoa-A", "8h"); var b = new Hs256TokenService("khoa-B-khoa-B-khoa-B", "8h");
        var t = a.Issue(Claims());
        Assert.Null(b.Read("Bearer " + t));
        Assert.Null(a.Read("Bearer " + t[..^2] + "xx"));
        Assert.Null(a.Read(t));            // thiếu tiền tố Bearer
        Assert.Null(a.Read("Bearer abc"));
        Assert.Null(a.Read(null));
    }

    [Fact] public void Token_het_han_bi_tu_choi()
    {
        var svc = new Hs256TokenService("secret-test-key-123", "-10s");
        Assert.Null(svc.Read("Bearer " + svc.Issue(Claims())));
    }
}
