using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Cache;

public sealed class RedisCacheService(IOptions<CacheOptions> opts) : ICacheService
{
    private readonly IDatabase _db = ConnectionMultiplexer.Connect(opts.Value.ConnectionString).GetDatabase();
    private readonly TimeSpan _defaultExpiry = TimeSpan.FromMinutes(opts.Value.DefaultExpiryMinutes);

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var value = await _db.StringGetAsync(key);
        return value.IsNullOrEmpty ? default : JsonSerializer.Deserialize<T>((string)value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, json, expiry ?? _defaultExpiry);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default) =>
        await _db.KeyDeleteAsync(key);

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default) =>
        await _db.KeyExistsAsync(key);
}
