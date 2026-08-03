using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Storage;

public sealed class StorageBucketInitializer(
    IStorageService storage,
    ILogger<StorageBucketInitializer> logger) : IHostedService
{
    private static readonly string[] BucketsLogicos = ["veloxml", "documentos", "arquivos", "thumbnails", "blog", "certificados"];

    public async Task StartAsync(CancellationToken ct)
    {
        // No S3 de produção, todos os buckets lógicos resolvem pro mesmo bucket físico —
        // Distinct() evita tentar garantir o mesmo bucket 5 vezes seguidas.
        var buckets = BucketsLogicos.Select(storage.ResolveBucket).Distinct();

        foreach (var bucket in buckets)
        {
            try
            {
                await storage.EnsureBucketExistsAsync(bucket, ct);
                logger.LogDebug("Storage bucket ready: {Bucket}", bucket);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not ensure storage bucket '{Bucket}'. Storage may be unavailable.", bucket);
            }
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
