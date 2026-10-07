using System.Net;
using System.Text.Json.Nodes;
using HUMG.CMS.Domain.Common;
using Npgsql;

namespace HUMG.CMS.Infrastructure.Persistence.Relational;

/// <summary>Kiểu cột và cách chuyển đổi tài liệu JSON ↔ PostgreSQL.</summary>
public enum CT { Text, Int, Bool, Ts, Date, TextArray, Json, Enum, Inet }

/// <summary>Một cột ánh xạ: trường của tài liệu ↔ cột của bảng. <c>Hide</c>: chỉ ghi, không đưa ra tài liệu.</summary>
public sealed record Col(string Field, string Column, CT Type, object? Default = null, string? EnumType = null, bool Hide = false)
{
    /// <summary>Biểu thức SELECT trả về giá trị dạng nguyên thủy (timestamptz → ISO UTC, jsonb/enum/inet → text).</summary>
    public string Select(string alias = "") { var c = alias + Column; return Type switch
    {
        CT.Ts => $"to_char({c} AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')",
        CT.Date => $"to_char({c}, 'YYYY-MM-DD')",
        CT.Json or CT.Enum => $"{c}::text",
        CT.Inet => $"host({c})",
        _ => c,
    }; }

    public string Cast(string p) => Type switch
    {
        CT.Ts => $"{p}::timestamptz", CT.Date => $"{p}::date", CT.Json => $"{p}::jsonb", CT.Enum => $"{p}::{EnumType}", CT.Inet => $"{p}::inet",
        CT.TextArray => $"{p}::text[]", _ => p,
    };

    /// <summary>Giá trị tham số SQL từ tài liệu (null → mặc định của cột hoặc NULL).</summary>
    public object? ToDb(JsonNode? v)
    {
        object? r = null;
        if (v is not null) r = Type switch
        {
            CT.Text or CT.Enum => Doc.AsString(v),
            CT.Int => Doc.AsLong(v),
            CT.Bool => Doc.Truthy(v),
            CT.Ts or CT.Date => Doc.AsString(v) is { Length: > 0 } s ? s : null,
            CT.TextArray => v is JsonArray a ? a.Select(Doc.AsString).Where(x => x is not null).Select(x => x!).ToArray() : null,
            CT.Json => Doc.Stringify(v),
            CT.Inet => Doc.AsString(v) is { } ip && IPAddress.TryParse(ip, out var addr) ? addr.ToString() : null,
            _ => null,
        };
        if (r is null && Default is not null) r = Default is Func<object> f ? f() : Default;
        return r;
    }

    public JsonNode? FromDb(object? v)
    {
        if (v is null or DBNull) return null;
        return Type switch
        {
            CT.Json => JsonNode.Parse((string)v),
            CT.TextArray => new JsonArray(((string[])v).Select(x => (JsonNode?)JsonValue.Create(x)).ToArray()),
            CT.Int => JsonValue.Create(Convert.ToInt64(v)),
            CT.Bool => JsonValue.Create((bool)v),
            _ => JsonValue.Create(Convert.ToString(v)),
        };
    }
}

/// <summary>Truy cập SQL trong transaction hiện hành.</summary>
public sealed class Db
{
    public NpgsqlConnection Conn { get; }
    public NpgsqlTransaction Tx { get; }
    public Db(NpgsqlConnection conn, NpgsqlTransaction tx) { Conn = conn; Tx = tx; }

    private NpgsqlCommand Cmd(string sql, (string, object?)[] ps)
    {
        var c = new NpgsqlCommand(sql, Conn, Tx);
        foreach (var (n, v) in ps) c.Parameters.Add(new NpgsqlParameter(n, v ?? DBNull.Value));
        return c;
    }

    public List<object?[]> Query(string sql, params (string, object?)[] ps)
    {
        using var c = Cmd(sql, ps); using var r = c.ExecuteReader();
        var rows = new List<object?[]>();
        while (r.Read()) { var row = new object?[r.FieldCount]; for (var i = 0; i < row.Length; i++) row[i] = r.IsDBNull(i) ? null : r.GetValue(i); rows.Add(row); }
        return rows;
    }

    public int Exec(string sql, params (string, object?)[] ps) { using var c = Cmd(sql, ps); return c.ExecuteNonQuery(); }
    public object? Scalar(string sql, params (string, object?)[] ps) { using var c = Cmd(sql, ps); var v = c.ExecuteScalar(); return v is DBNull ? null : v; }
}
