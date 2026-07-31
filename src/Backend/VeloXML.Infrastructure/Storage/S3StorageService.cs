using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Storage;

public sealed class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _client;
    private readonly string _bucketName;

    public S3StorageService(IOptions<S3Options> opts)
    {
        var credentials = new BasicAWSCredentials(opts.Value.AccessKey, opts.Value.SecretKey);
        var config = new AmazonS3Config { RegionEndpoint = RegionEndpoint.GetBySystemName(opts.Value.Region) };
        _client = new AmazonS3Client(credentials, config);
        _bucketName = opts.Value.BucketName;
    }

    // Em produção usamos um único bucket S3 pra tudo (decisão do time) — qualquer "bucket
    // lógico" (documentos, blog, veloxml) resolve pro mesmo bucket físico. As chaves de cada
    // categoria já têm formatos distintos o suficiente (ex.: documentos sempre começam com o
    // CNPJ, contador sempre com "contadores/") pra nunca colidir dentro do bucket único.
    public string ResolveBucket(string logicalBucket) => _bucketName;

    public async Task<string> UploadAsync(Stream stream, string objectKey, string bucket, string contentType, CancellationToken ct = default)
    {
        await _client.PutObjectAsync(new PutObjectRequest
        {
            BucketName = bucket,
            Key = objectKey,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false,
        }, ct);

        // O objectKey é o que fica gravado no banco — a URL de download é sempre resolvida
        // sob demanda (GetPresignedUrlAsync) e nunca persistida, já que uma pre-signed URL
        // expira e não deve ser tratada como referência permanente.
        return objectKey;
    }

    public async Task<Stream> DownloadAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        using var response = await _client.GetObjectAsync(new GetObjectRequest
        {
            BucketName = bucket,
            Key = objectKey,
        }, ct);

        var ms = new MemoryStream();
        await response.ResponseStream.CopyToAsync(ms, ct);
        ms.Position = 0;
        return ms;
    }

    public async Task<bool> ExistsAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        try
        {
            await _client.GetObjectMetadataAsync(new GetObjectMetadataRequest { BucketName = bucket, Key = objectKey }, ct);
            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task DeleteAsync(string objectKey, string bucket, CancellationToken ct = default)
    {
        await _client.DeleteObjectAsync(new DeleteObjectRequest
        {
            BucketName = bucket,
            Key = objectKey,
        }, ct);
    }

    public Task<string> GetPresignedUrlAsync(string objectKey, string bucket, int expiresInSeconds = 3600)
    {
        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds),
        });
        return Task.FromResult(url);
    }

    public async Task EnsureBucketExistsAsync(string bucket, CancellationToken ct = default)
    {
        var exists = await Amazon.S3.Util.AmazonS3Util.DoesS3BucketExistV2Async(_client, bucket);
        if (!exists)
            await _client.PutBucketAsync(new PutBucketRequest { BucketName = bucket }, ct);
    }
}
