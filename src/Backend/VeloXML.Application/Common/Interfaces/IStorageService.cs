namespace VeloXML.Application.Common.Interfaces;

public interface IStorageService
{
    // Traduz um "bucket lógico" (ex.: "documentos", "blog") pro bucket físico que o provider
    // ativo realmente usa. No MinIO cada um é um bucket separado (identidade); no S3 de
    // produção tudo cai num único bucket (decisão do time), então isso vira o mesmo nome pra
    // qualquer bucket lógico. Chamadores sempre resolvem o bucket com isso antes de gravar,
    // pra não hardcodar a topologia de um provider específico fora da camada de storage.
    string ResolveBucket(string logicalBucket);

    Task<string> UploadAsync(Stream stream, string objectKey, string bucket, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string objectKey, string bucket, CancellationToken ct = default);
    Task<bool> ExistsAsync(string objectKey, string bucket, CancellationToken ct = default);
    Task DeleteAsync(string objectKey, string bucket, CancellationToken ct = default);
    // downloadFileName, quando informado, força o S3/MinIO a responder com
    // Content-Disposition: attachment — sem isso o navegador abre XML/PDF numa aba em vez de
    // baixar o arquivo, já que o bucket não guarda esse header por objeto.
    Task<string> GetPresignedUrlAsync(string objectKey, string bucket, int expiresInSeconds = 3600, string? downloadFileName = null);
    Task EnsureBucketExistsAsync(string bucket, CancellationToken ct = default);
}
