using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Storage;

public sealed class MinioBucketInitializer(
    IStorageService storage,
    ILogger<MinioBucketInitializer> logger) : IHostedService
{
    private static readonly string[] Buckets = ["veloxml", "documentos", "arquivos", "thumbnails"];

    public async Task StartAsync(CancellationToken ct)
    {
        foreach (var bucket in Buckets)
        {
            try
            {
                await storage.EnsureBucketExistsAsync(bucket, ct);
                logger.LogDebug("MinIO bucket ready: {Bucket}", bucket);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Could not ensure MinIO bucket '{Bucket}'. Storage may be unavailable.", bucket);
            }
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
