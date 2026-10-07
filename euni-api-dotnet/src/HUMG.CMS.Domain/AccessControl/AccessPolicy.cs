using HUMG.CMS.Domain.Workflow;

namespace HUMG.CMS.Domain.AccessControl;

/// <summary>
/// Phân quyền mức bản ghi (docs/design/CMS_DESIGN.md §5): quyền hiệu lực = quyền chức năng <c>{type}.{action}</c> (role trong token)
/// VÀ có grant khớp phạm vi. Ngoại lệ: <c>cms.*</c> bỏ qua mọi kiểm tra; người tạo luôn xem được bản ghi của mình và sửa được khi còn là bản nháp.
/// Lớp thuần — dữ liệu grant và cây đơn vị do Application truyền vào.
/// </summary>
public sealed class AccessPolicy
{
    public static readonly string[] Actions = { "view", "edit", "review", "publish" };

    private readonly IReadOnlyList<GrantRef> _grants;
    private readonly OrgTree _tree;
    private readonly Func<long> _nowMs;

    public AccessPolicy(IReadOnlyList<GrantRef> grants, OrgTree tree, Func<long>? nowMs = null)
    {
        _grants = grants;
        _tree = tree;
        _nowMs = nowMs ?? (() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
    }

    public OrgTree Tree => _tree;

    public HashSet<string> Principals(UserPrincipal user)
    {
        var set = new HashSet<string> { $"user:{user.Sub}" };
        foreach (var u in _tree.WithAncestors(user.Units)) set.Add($"unit:{u}");
        foreach (var r in user.Roles) set.Add($"role:{r}");
        return set;
    }

    private bool Alive(GrantRef g) => !g.Deleted && (g.ExpiresAtMs is null || g.ExpiresAtMs > _nowMs());

    /// <summary>Các trang (tenant) user được vào CMS = tenant có ít nhất một grant khớp user. cms.* (super) vào mọi tenant — xử lý ở nơi gọi.</summary>
    public List<string> TenantsOf(UserPrincipal user)
    {
        var mine = Principals(user);
        return _grants.Where(g => Alive(g) && mine.Contains($"{g.PrincipalType}:{g.PrincipalId}")).Select(g => g.TenantId).Distinct().ToList();
    }

    /// <summary>Các grant (đang hiệu lực) của user trong tenant cho loại tài nguyên <c>type</c>.</summary>
    public List<GrantRef> GrantsFor(UserPrincipal user, string tenant, string type)
    {
        var mine = Principals(user);
        return _grants.Where(g => g.TenantId == tenant && Alive(g) && (g.ResourceType == "*" || g.ResourceType == type) && mine.Contains($"{g.PrincipalType}:{g.PrincipalId}")).ToList();
    }

    private static bool GrantAllows(GrantRef g, string action) =>
        g.Permissions.Contains("manage") || g.Permissions.Contains(action) || (action == "view" && g.Permissions.Count > 0);

    private bool ScopeMatches(GrantRef g, RecordRef? rec)
    {
        if (g.ScopeType == "tenant") return true;
        if (rec is null) return false;
        var scope = g.ScopeId ?? "null";
        return g.ScopeType switch
        {
            "category" => (rec.CategoryId ?? "") == scope,
            "record" => rec.Id.ToString() == scope,
            "unit" => _tree.IsWithin(rec.OwnerUnitCode, scope),
            _ => false,
        };
    }

    /// <summary>
    /// user được thực hiện <c>action</c> trên bản ghi <c>rec</c> (loại <c>type</c>) trong <c>tenant</c>?
    /// rec = null: hỏi "có phạm vi nào cho phép không" (vd. hiện nút "Thêm mới").
    /// </summary>
    public bool Can(UserPrincipal? user, string tenant, string type, string action, RecordRef? rec = null)
    {
        if (user is null) return false;
        if (RoleCatalog.IsSuper(user.Perms)) return true;
        if (!RoleCatalog.HasPerm(user.Perms.ToList(), $"{type}.{action}")) return false;
        if (rec is not null && rec.CreatedBy == user.Sub && (action == "view" || (action == "edit" && rec.Status == WorkflowStatus.Draft))) return true;
        var gs = GrantsFor(user, tenant, type).Where(g => GrantAllows(g, action)).ToList();
        return rec is not null ? gs.Any(g => ScopeMatches(g, rec)) : gs.Count > 0;
    }

    /// <summary>Các hành động hợp lệ trên bản ghi — trả về cho UI (<c>allowedActions</c>). Backend vẫn kiểm tra lại ở mỗi lệnh.</summary>
    public List<string> AllowedActions(UserPrincipal user, string tenant, string type, RecordRef rec)
    {
        bool C(string a) => Can(user, tenant, type, a, rec);
        if (rec.Deleted) return C("edit") || C("publish") ? new List<string> { "restore" } : new List<string>();
        var o = new List<string>();
        var st = rec.Status;
        if (st != WorkflowStatus.Archived && (C("edit") || (st == WorkflowStatus.Published && C("publish")))) o.Add("edit");
        if (st == WorkflowStatus.Draft && C("edit")) o.Add("submit");
        if (st == WorkflowStatus.PendingReview && C("review")) { o.Add("approve"); o.Add("reject"); }
        if ((st == WorkflowStatus.Draft || st == WorkflowStatus.Archived) && C("publish")) o.Add("publish");
        if (st == WorkflowStatus.Published && C("publish")) o.Add("unpublish");
        if ((st == WorkflowStatus.Published || st == WorkflowStatus.Draft) && C("publish")) o.Add("archive");
        if (rec.HasPendingRevision && C("review")) { o.Add("approve-revision"); o.Add("reject-revision"); }
        if ((st != WorkflowStatus.Published && C("edit")) || C("publish")) o.Add("delete");
        return o;
    }
}
