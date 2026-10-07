namespace HUMG.CMS.Domain.AccessControl;

/// <summary>Cây đơn vị (bản sao chỉ đọc của QLNS/QLĐT).</summary>
public sealed class OrgTree
{
    private readonly Func<string, string?> _parentOf;
    public OrgTree(Func<string, string?> parentOf) => _parentOf = parentOf;

    /// <summary>code + mọi đơn vị cha: DCCTKT66A → [DCCTKT66A, BM-KHMT, CNTT, HUMG]</summary>
    public List<string> WithAncestors(IEnumerable<string> codes)
    {
        var seen = new HashSet<string>();
        var order = new List<string>();
        foreach (var start in codes)
        {
            string? code = start;
            for (var guard = 0; !string.IsNullOrEmpty(code) && guard < 20; guard++)
            {
                if (seen.Add(code)) order.Add(code);
                code = _parentOf(code);
            }
        }
        return order;
    }

    public bool IsWithin(string? child, string ancestor) => !string.IsNullOrEmpty(child) && WithAncestors(new[] { child }).Contains(ancestor);
}
