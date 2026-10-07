using System.Text.Json.Nodes;
using HUMG.CMS.Application.Abstractions;

namespace HUMG.CMS.Infrastructure.Storage;

public sealed class FileMockData : IMockData
{
    private readonly string _dir;
    private readonly Dictionary<string, JsonNode> _cache = new();
    public FileMockData(string dir) => _dir = dir;

    public IEnumerable<string> Names => Directory.Exists(_dir) ? Directory.GetFiles(_dir, "*.json").Select(Path.GetFileNameWithoutExtension).Where(n => n is not null).Select(n => n!).OrderBy(n => n, StringComparer.Ordinal) : Enumerable.Empty<string>();

    public JsonNode Load(string name)
    {
        if (!_cache.TryGetValue(name, out var node))
            _cache[name] = node = JsonNode.Parse(File.ReadAllText(Path.Combine(_dir, name + ".json")))!;
        return node.DeepClone();
    }
}
