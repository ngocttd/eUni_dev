using HUMG.CMS.Domain.AccessControl;
using HUMG.CMS.Domain.Announcements;
using HUMG.CMS.Domain.Common;
using HUMG.CMS.Domain.Workflow;
using Xunit;

namespace HUMG.CMS.Tests;

public class TextUtilTests
{
    [Theory]
    [InlineData("Hội thảo Địa chất & GIS", "hoi thao dia chat & gis")]
    [InlineData("ĐÀO TẠO", "dao tao")]
    [InlineData(null, "")]
    public void Norm_bo_dau_tieng_Viet(string? input, string expected) => Assert.Equal(expected, TextUtil.Norm(input));

    [Fact] public void Slugify_giong_mock_Node() => Assert.Equal("le-ky-niem-60-nam", TextUtil.Slugify("Lễ kỷ niệm 60 năm!"));
    [Theory] [InlineData("12", 12)] [InlineData(" 5 ", 5)] [InlineData("", 0)] public void ToNumber_nhu_JS(string s, double d) => Assert.Equal(d, TextUtil.ToNumber(s));
    [Fact] public void ToNumber_khong_hop_le_la_NaN() => Assert.True(double.IsNaN(TextUtil.ToNumber("abc")));
}

public class WorkflowTests
{
    [Fact]
    public void Bang_chuyen_trang_thai_dung_thiet_ke()
    {
        var r = WorkflowTransitions.Rules;
        Assert.Equal(WorkflowStatus.PendingReview, r["submit"].To);
        Assert.Equal("edit", r["submit"].Perm);
        Assert.True(r["reject"].NeedNote);
        Assert.Equal("review", r["approve"].Perm);
        Assert.Contains(WorkflowStatus.Archived, r["publish"].From);
        Assert.Equal(WorkflowStatus.Draft, r["unpublish"].To);
        Assert.DoesNotContain("status", WorkflowTransitions.Rules.Keys); // không có "PUT tùy ý đổi status"
    }

    [Theory] [InlineData("published", "published")] [InlineData("2", "published")] [InlineData("pending", "pending_review")] [InlineData("zzz", null)]
    public void Parse_trang_thai_ke_ca_ma_cu(string input, string? expected) => Assert.Equal(expected, WorkflowStatus.Parse(input));
}

public class AccessPolicyTests
{
    private static readonly Dictionary<string, string?> Parents = new() { ["HUMG"] = null, ["CNTT"] = "HUMG", ["BM-KHMT"] = "CNTT", ["P-TT"] = "HUMG" };
    private static OrgTree Tree => new(c => Parents.GetValueOrDefault(c));

    private static UserPrincipal User(string sub, string[] roles, string[] units) =>
        new(sub, sub, null, null, roles, RoleCatalog.PermissionsOf(roles), new[] { "humg" }, units, null, null);

    private static GrantRef Grant(string principal, string scopeType, string? scope, string[] perms, string resource = "*", string tenant = "humg", long? exp = null, bool deleted = false) =>
        new(tenant, principal.Split(':')[0], principal.Split(':')[1], resource, scopeType, scope, perms, exp, deleted);

    private static RecordRef News(long id, string unit, string? cat = null, string? creator = null, string status = "published") => new(id, cat ?? "", unit, creator, status, false, false);

    [Fact]
    public void Cms_admin_bo_qua_moi_kiem_tra() =>
        Assert.True(new AccessPolicy(new List<GrantRef>(), Tree).Can(User("a", new[] { "cms.admin" }, Array.Empty<string>()), "cntt", "news", "publish", News(1, "P-TT")));

    [Fact]
    public void Can_ca_quyen_chuc_nang_va_grant()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:u1", "tenant", null, new[] { "view", "edit" }) }, Tree);
        Assert.True(p.Can(User("u1", new[] { "cms.author" }, Array.Empty<string>()), "humg", "news", "edit", News(1, "P-TT")));
        Assert.False(p.Can(User("u1", new[] { "cms.author" }, Array.Empty<string>()), "humg", "news", "publish", News(1, "P-TT"))); // thiếu grant publish
        Assert.False(p.Can(User("u1", new[] { "student" }, Array.Empty<string>()), "humg", "news", "edit", News(1, "P-TT")));      // thiếu quyền chức năng
    }

    [Fact]
    public void Grant_theo_don_vi_bao_gom_don_vi_con()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:u1", "unit", "CNTT", new[] { "review" }, "news") }, Tree);
        var u = User("u1", new[] { "cms.reviewer" }, Array.Empty<string>());
        Assert.True(p.Can(u, "humg", "news", "review", News(1, "BM-KHMT")));
        Assert.False(p.Can(u, "humg", "news", "review", News(2, "P-TT")));
    }

    [Fact]
    public void Grant_theo_don_vi_cua_nguoi_dung_ke_thua_tu_don_vi_cha()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("unit:CNTT", "tenant", null, new[] { "view" }) }, Tree);
        Assert.True(p.Can(User("u1", new[] { "cms.viewer" }, new[] { "BM-KHMT" }), "humg", "news", "view", News(1, "P-TT")));
    }

    [Fact]
    public void Grant_het_han_hoac_da_xoa_khong_con_hieu_luc()
    {
        var past = DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeMilliseconds();
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:u1", "tenant", null, new[] { "view" }, exp: past), Grant("user:u1", "tenant", null, new[] { "view" }, deleted: true) }, Tree);
        Assert.False(p.Can(User("u1", new[] { "cms.viewer" }, Array.Empty<string>()), "humg", "news", "view", News(1, "P-TT")));
    }

    [Fact]
    public void Grant_khong_co_hieu_luc_o_tenant_khac()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:u1", "tenant", null, new[] { "manage" }) }, Tree);
        Assert.False(p.Can(User("u1", new[] { "cms.editor" }, Array.Empty<string>()), "cntt", "news", "edit", News(1, "P-TT")));
    }

    [Fact]
    public void Tac_gia_xem_duoc_bai_cua_minh_va_sua_khi_con_nhap()
    {
        var p = new AccessPolicy(new List<GrantRef>(), Tree);
        var u = User("u1", new[] { "cms.author" }, Array.Empty<string>());
        Assert.True(p.Can(u, "humg", "news", "edit", News(1, "P-TT", creator: "u1", status: "draft")));
        Assert.False(p.Can(u, "humg", "news", "edit", News(2, "P-TT", creator: "u1", status: "published")));
        Assert.True(p.Can(u, "humg", "news", "view", News(2, "P-TT", creator: "u1", status: "published")));
    }

    [Fact]
    public void AllowedActions_theo_trang_thai()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:e", "tenant", null, new[] { "view", "edit", "review", "publish" }) }, Tree);
        var u = User("e", new[] { "cms.editor" }, Array.Empty<string>());
        Assert.Contains("submit", p.AllowedActions(u, "humg", "news", News(1, "P-TT", status: "draft")));
        var pending = p.AllowedActions(u, "humg", "news", News(2, "P-TT", status: "pending_review"));
        Assert.Contains("approve", pending); Assert.Contains("reject", pending); Assert.DoesNotContain("submit", pending);
        Assert.Equal(new List<string> { "restore" }, p.AllowedActions(u, "humg", "news", News(3, "P-TT") with { Deleted = true }));
    }

    [Fact]
    public void TenantsOf_chi_tinh_tenant_co_grant()
    {
        var p = new AccessPolicy(new List<GrantRef> { Grant("user:u1", "tenant", null, new[] { "view" }, tenant: "cntt") }, Tree);
        Assert.Equal(new[] { "cntt" }, p.TenantsOf(User("u1", new[] { "cms.viewer" }, Array.Empty<string>())));
    }
}

public class AudienceTests
{
    private static readonly OrgTree Tree = new(c => c switch { "DCCTKT66A" => "BM-KHMT", "BM-KHMT" => "CNTT", "CNTT" => "HUMG", _ => null });

    [Fact]
    public void Doi_tuong_AND_trong_dong_OR_giua_cac_dong_va_loai_tru()
    {
        var targets = new List<TargetRef> { new("student", "CNTT", null, false), new(null, null, "u-gv", false), new(null, "DCCTKT66A", null, true) };
        var sv = Audiences.MembershipOf("sv1", new[] { "student" }, new[] { "BM-KHMT" }, Tree);
        var svExcluded = Audiences.MembershipOf("sv2", new[] { "student" }, new[] { "DCCTKT66A" }, Tree);
        var gv = Audiences.MembershipOf("u-gv", new[] { "lecturer" }, Array.Empty<string>(), Tree);
        var other = Audiences.MembershipOf("x", new[] { "parent" }, Array.Empty<string>(), Tree);
        Assert.True(Audiences.IsRecipient(targets, sv));
        Assert.False(Audiences.IsRecipient(targets, svExcluded));
        Assert.True(Audiences.IsRecipient(targets, gv));
        Assert.False(Audiences.IsRecipient(targets, other));
    }

    [Fact] public void Vai_tro_CMS_tinh_la_can_bo() => Assert.Contains("staff", Audiences.MembershipOf("a", new[] { "cms.editor" }, Array.Empty<string>(), Tree).Audiences);
}
