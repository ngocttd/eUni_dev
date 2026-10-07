using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace HUMG.CMS.Domain.Common;

/// <summary>Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, slug) — không phụ thuộc ICU nên chạy được ở môi trường InvariantGlobalization.</summary>
public static class TextUtil
{
    private static readonly Dictionary<char, char> Fold = BuildFold();

    private static Dictionary<char, char> BuildFold()
    {
        var map = new Dictionary<char, char>();
        void Add(char to, string from) { foreach (var c in from) map[c] = to; }
        Add('a', "àáạảãâầấậẩẫăằắặẳẵäåāą");
        Add('e', "èéẹẻẽêềếệểễëēę");
        Add('i', "ìíịỉĩïīį");
        Add('o', "òóọỏõôồốộổỗơờớợởỡöøō");
        Add('u', "ùúụủũưừứựửữüūų");
        Add('y', "ỳýỵỷỹÿ");
        Add('d', "đ");
        Add('c', "çćč");
        Add('n', "ñńň");
        Add('s', "śšß");
        Add('z', "źżž");
        return map;
    }

    /// <summary>Tương đương JS: lowercase → NFD → bỏ dấu kết hợp → đ→d.</summary>
    public static string Norm(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new StringBuilder(s.Length);
        foreach (var ch in s.ToLowerInvariant())
        {
            if (ch >= '̀' && ch <= 'ͯ') continue; // dấu kết hợp (chuỗi đã ở dạng NFD)
            sb.Append(Fold.TryGetValue(ch, out var f) ? f : ch);
        }
        return sb.ToString();
    }

    private static readonly Regex NonAlnum = new("[^a-z0-9]+", RegexOptions.Compiled);

    public static string Slugify(string? s) => NonAlnum.Replace(Norm(s), "-").Trim('-');

    /// <summary>JS `Number(s)`: trim, rỗng → 0, không hợp lệ → NaN.</summary>
    public static double ToNumber(string? s)
    {
        if (s is null) return double.NaN;
        var t = s.Trim();
        if (t.Length == 0) return 0;
        return double.TryParse(t, NumberStyles.Float, CultureInfo.InvariantCulture, out var d) ? d : double.NaN;
    }
}
