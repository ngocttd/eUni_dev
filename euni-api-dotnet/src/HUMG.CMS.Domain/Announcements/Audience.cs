using HUMG.CMS.Domain.AccessControl;

namespace HUMG.CMS.Domain.Announcements;

/// <summary>Membership của một người: đối tượng (từ realm role), đơn vị trực tiếp + mọi đơn vị cha.</summary>
public sealed record Membership(string Sub, IReadOnlyList<string> Audiences, IReadOnlyList<string> Units);

/// <summary>Một dòng đối tượng nhận: audience × unitCode × userSub (AND); các dòng OR; dòng isExclude bị trừ.</summary>
public sealed record TargetRef(string? Audience, string? UnitCode, string? UserSub, bool IsExclude);

public static class Audiences
{
    /// <summary>Đối tượng nhận = realm role trên SSO (tầng 1).</summary>
    public static readonly (string Code, string Label)[] All =
    {
        ("student", "Sinh viên"), ("lecturer", "Giảng viên"), ("staff", "Cán bộ, chuyên viên"), ("manager", "Lãnh đạo"),
        ("parent", "Phụ huynh"), ("applicant", "Thí sinh"), ("alumni", "Cựu người học"),
    };
    public static bool Exists(string code) => All.Any(a => a.Code == code);
    public static string? Label(string code) => All.FirstOrDefault(a => a.Code == code).Label;

    /// <summary>Vai trò CMS tính là cán bộ.</summary>
    public static Membership MembershipOf(string sub, IEnumerable<string> roles, IEnumerable<string> units, OrgTree tree)
    {
        var rs = roles.ToList();
        var audiences = All.Select(a => a.Code).Where(rs.Contains).ToList();
        if (rs.Any(r => r.StartsWith("cms.")) && !audiences.Contains("staff")) audiences.Add("staff");
        return new Membership(sub, audiences, tree.WithAncestors(units));
    }

    private static bool RowMatches(TargetRef t, Membership m) =>
        (string.IsNullOrEmpty(t.Audience) || m.Audiences.Contains(t.Audience))
        && (string.IsNullOrEmpty(t.UnitCode) || m.Units.Contains(t.UnitCode))
        && (string.IsNullOrEmpty(t.UserSub) || t.UserSub == m.Sub);

    /// <summary>Thông báo có gửi tới người có membership <c>m</c> không.</summary>
    public static bool IsRecipient(IReadOnlyList<TargetRef> targets, Membership m) =>
        targets.Any(t => !t.IsExclude && RowMatches(t, m)) && !targets.Any(t => t.IsExclude && RowMatches(t, m));
}
