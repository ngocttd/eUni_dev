namespace HUMG.CMS.Domain.Workflow;

public static class WorkflowStatus
{
    public const string Draft = "draft";
    public const string PendingReview = "pending_review";
    public const string Published = "published";
    public const string Archived = "archived";
    public static readonly string[] All = { Draft, PendingReview, Published, Archived };

    /// <summary>Mã số cũ (0..3) vẫn được chấp nhận ở API để tương thích.</summary>
    public static string? Parse(string? v)
    {
        if (string.IsNullOrEmpty(v)) return null;
        if (All.Contains(v)) return v;
        return v switch { "0" => Draft, "1" => PendingReview, "2" => Published, "3" => Archived, "pending" => PendingReview, _ => null };
    }
}

/// <summary>Một bước chuyển trạng thái. <c>Perm</c> = hành động ACL cần có trên bản ghi.</summary>
public sealed record TransitionRule(string[] From, string To, string Perm, bool NeedNote, string Label);

/// <summary>
/// Bảng chuyển trạng thái dùng chung cho tin tức và thông báo (docs/design/CMS_DESIGN.md §7.1).
/// Trạng thái chỉ đổi qua các hành động này — không có PUT tùy ý đổi <c>status</c>.
/// </summary>
public static class WorkflowTransitions
{
    public const string ApproveRevision = "approve-revision";
    public const string RejectRevision = "reject-revision";

    public static readonly IReadOnlyDictionary<string, TransitionRule> Rules = new Dictionary<string, TransitionRule>
    {
        ["submit"] = new(new[] { WorkflowStatus.Draft }, WorkflowStatus.PendingReview, "edit", false, "Gửi duyệt"),
        ["reject"] = new(new[] { WorkflowStatus.PendingReview }, WorkflowStatus.Draft, "review", true, "Trả lại"),
        ["approve"] = new(new[] { WorkflowStatus.PendingReview }, WorkflowStatus.Published, "review", false, "Duyệt & xuất bản"),
        ["publish"] = new(new[] { WorkflowStatus.Draft, WorkflowStatus.Archived }, WorkflowStatus.Published, "publish", false, "Xuất bản"),
        ["unpublish"] = new(new[] { WorkflowStatus.Published }, WorkflowStatus.Draft, "publish", false, "Gỡ xuống"),
        ["archive"] = new(new[] { WorkflowStatus.Published, WorkflowStatus.Draft }, WorkflowStatus.Archived, "publish", false, "Lưu trữ"),
    };

    public static bool IsRevisionAction(string action) => action is ApproveRevision or RejectRevision;

    /// <summary>Trường workflow / hệ thống: không bị ghi đè khi sửa nội dung hay khôi phục revision.</summary>
    public static readonly HashSet<string> SystemFields = new()
    {
        "id", "tenantId", "status", "publishAt", "firstPublishedAt", "submittedAt", "submittedBy", "reviewedAt", "reviewedBy", "reviewNote",
        "pendingRevisionId", "version", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy", "viewCount", "recallReason",
    };

    /// <summary>Trường không đưa vào snapshot revision (thay đổi liên tục / do hệ thống quản lý).</summary>
    public static readonly HashSet<string> VolatileFields = new()
    {
        "id", "tenantId", "viewCount", "version", "pendingRevisionId", "deletedAt", "deletedBy", "updatedAt", "updatedBy",
    };
}
