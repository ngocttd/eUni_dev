using System.Globalization;

namespace HUMG.CMS.Domain.Common;

public static class TimeUtil
{
    /// <summary>Thời gian hiện tại dạng ISO-8601 UTC có mili-giây (giống `new Date().toISOString()`).</summary>
    public static string NowIso() => ToIso(DateTimeOffset.UtcNow);
    public static string ToIso(DateTimeOffset t) => t.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
    public static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>`Date.parse` — null khi không phân tích được (JS: NaN).</summary>
    public static long? ParseMs(string? v)
    {
        if (string.IsNullOrWhiteSpace(v)) return null;
        return DateTimeOffset.TryParse(v, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var d) ? d.ToUnixTimeMilliseconds() : null;
    }

    /// <summary>`Date.parse(v) || 0`</summary>
    public static long Ts(string? v) => ParseMs(v) ?? 0;
}
