using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Storage;

public sealed class MinioStorageService(IOptions<StorageOptions> opts) : IStorageService
{
    private readonly IMinioClient _client = new MinioClient()
        .WithEndpoint(opts.Value.Endpoint)
        .WithCredentials(opts.Value.AccessKey, opts.Value.SecretKey)
        .WithSSL(opts.Value.UseSSL)
        .Build();

    public string ResolveBucket(string logicalBucket) => logicalBucket;

    public async Task<string> UploadAsync(Stream stream, string objectKey, string bucket, string contentType, CancellationToken ct = default)
    {
        await _client.PutObjectAsync(new PutObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType(contentType), ct);

        // O objectKey é o que fica gravado no banco — a URL de download é sempre resolvida
        // sob demanda (GetPresignedUrlAsync) e nunca persistida, já que uma pre-signed URL
        // expira e não deve ser tratada como referência permanente.
        return objectKey;
    }

    public async Task<Stream> DownloadAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        var ms = new MemoryStream();
        await _client.GetObjectAsync(new GetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithCallbackStream(s => s.CopyTo(ms)), ct);
        ms.Position = 0;
        return ms;
    }

    public async Task<bool> ExistsAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        try
        {
            await _client.StatObjectAsync(new StatObjectArgs().WithBucket(bucket).WithObject(objectKey), ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task DeleteAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        await _client.RemoveObjectAsync(new RemoveObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey), ct);
    }

    public async Task<string> GetPresignedUrlAsync(string objectKey, string bucket, int expiresInSeconds = 3600)
    {
        return await _client.PresignedGetObjectAsync(new PresignedGetObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithExpiry(expiresInSeconds));
    }

    public async Task EnsureBucketExistsAsync(string bucket, CancellationToken ct = default)
    {
        var exists = await _client.BucketExistsAsync(new BucketExistsArgs().WithBucket(bucket), ct);
        if (!exists)
            await _client.MakeBucketAsync(new MakeBucketArgs().WithBucket(bucket), ct);
    }
}
