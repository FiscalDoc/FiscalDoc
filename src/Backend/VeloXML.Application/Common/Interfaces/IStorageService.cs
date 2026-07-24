namespace VeloXML.Application.Common.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(Stream stream, string objectKey, string bucket, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string objectKey, string bucket, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, string bucket, CancellationToken ct = default);
    Task<string> GetPresignedUrlAsync(string objectKey, string bucket, int expiresInSeconds = 3600);
    Task EnsureBucketExistsAsync(string bucket, CancellationToken ct = default);
}
