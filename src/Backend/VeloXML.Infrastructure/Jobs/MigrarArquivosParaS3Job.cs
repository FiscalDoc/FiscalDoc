using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VeloXML.Application.Common;
using VeloXML.Domain.Interfaces;
using VeloXML.Infrastructure.Storage;

namespace VeloXML.Infrastructure.Jobs;

/// <summary>
/// Job de execução única (disparado manualmente pelo admin), não recorrente. Copia os
/// arquivos hoje no MinIO pro S3, sem apagar o original — a decisão de desligar o MinIO é
/// manual, depois de validado. Fala com os dois storages diretamente (não via IStorageService
/// "ativo") porque precisa dos dois ao mesmo tempo, independente de qual estiver registrado
/// como provider corrente.
/// </summary>
public sealed class MigrarArquivosParaS3Job(
    IUnitOfWork uow,
    IOptions<StorageOptions> minioOpts,
    IOptions<S3Options> s3Opts,
    ILogger<MigrarArquivosParaS3Job> logger)
{
    public const string JobId = "migrar-arquivos-s3";

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var minio = new MinioStorageService(minioOpts);
        var s3 = new S3StorageService(s3Opts);
        var s3Bucket = s3Opts.Value.BucketName;

        if (string.IsNullOrWhiteSpace(s3Bucket))
        {
            logger.LogWarning("[MigrarArquivosParaS3] S3:BucketName não configurado — migração cancelada.");
            return;
        }

        logger.LogInformation("[MigrarArquivosParaS3] Início da migração para o bucket '{Bucket}'.", s3Bucket);

        var (docMigrados, docPulados, docErros) = await MigrarDocumentosAsync(minio, s3, s3Bucket, ct);
        var (blogMigrados, blogPulados, blogErros) = await MigrarBlogAsync(minio, s3, s3Bucket, ct);
        var (fotoMigrados, fotoPulados, fotoErros) = await MigrarFotosContadorAsync(minio, s3, s3Bucket, ct);

        logger.LogInformation(
            "[MigrarArquivosParaS3] Concluído | Documentos: {DocMigrados} migrados / {DocPulados} pulados / {DocErros} erros | " +
            "Blog: {BlogMigrados} migrados / {BlogPulados} pulados / {BlogErros} erros | " +
            "Fotos de contador: {FotoMigrados} migrados / {FotoPulados} pulados / {FotoErros} erros",
            docMigrados, docPulados, docErros, blogMigrados, blogPulados, blogErros, fotoMigrados, fotoPulados, fotoErros);
    }

    private async Task<(int Migrados, int Pulados, int Erros)> MigrarDocumentosAsync(
        MinioStorageService minio, S3StorageService s3, string s3Bucket, CancellationToken ct)
    {
        int migrados = 0, pulados = 0, erros = 0;
        var arquivos = await uow.Arquivos.FindAsync(_ => true, ct);

        foreach (var arquivo in arquivos)
        {
            try
            {
                if (arquivo.Bucket == s3Bucket)
                {
                    pulados++;
                    continue;
                }

                var documento = await uow.Documentos.GetByIdAsync(arquivo.DocumentoId, ct);
                if (documento is null)
                {
                    logger.LogWarning("[MigrarArquivosParaS3] Documento {DocumentoId} não encontrado pro Arquivo {ArquivoId} — pulado.",
                        arquivo.DocumentoId, arquivo.Id);
                    pulados++;
                    continue;
                }

                var cliente = await uow.Clientes.GetByIdAsync(documento.ClienteId, ct);
                if (cliente is null)
                {
                    logger.LogWarning("[MigrarArquivosParaS3] Cliente {ClienteId} não encontrado pro Documento {DocumentoId} — pulado.",
                        documento.ClienteId, documento.Id);
                    pulados++;
                    continue;
                }

                var novaChave = StorageKeyHelper.MontarChaveDocumento(cliente.Cnpj, documento.DataEmissao, documento.ChaveAcesso);

                if (await s3.ExistsAsync(novaChave, s3Bucket, ct))
                {
                    arquivo.Bucket = s3Bucket;
                    arquivo.ObjectKey = novaChave;
                    uow.Arquivos.Update(arquivo);
                    pulados++;
                    continue;
                }

                await using var stream = await minio.DownloadAsync(arquivo.ObjectKey, arquivo.Bucket, ct);
                await s3.UploadAsync(stream, novaChave, s3Bucket, arquivo.MimeType, ct);

                arquivo.Bucket = s3Bucket;
                arquivo.ObjectKey = novaChave;
                uow.Arquivos.Update(arquivo);
                await uow.SaveChangesAsync(ct);
                migrados++;
            }
            catch (Exception ex)
            {
                erros++;
                logger.LogError(ex, "[MigrarArquivosParaS3] Erro ao migrar Arquivo {ArquivoId}.", arquivo.Id);
            }
        }

        return (migrados, pulados, erros);
    }

    private async Task<(int Migrados, int Pulados, int Erros)> MigrarBlogAsync(
        MinioStorageService minio, S3StorageService s3, string s3Bucket, CancellationToken ct)
    {
        int migrados = 0, pulados = 0, erros = 0;
        var posts = await uow.BlogPosts.FindAsync(p => p.ImagemCapaKey != null, ct);
        const string bucketOrigem = "blog";

        foreach (var post in posts)
        {
            var key = post.ImagemCapaKey!;
            try
            {
                if (await s3.ExistsAsync(key, s3Bucket, ct))
                {
                    pulados++;
                    continue;
                }

                await using var stream = await minio.DownloadAsync(key, bucketOrigem, ct);
                var contentType = key.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg";
                await s3.UploadAsync(stream, key, s3Bucket, contentType, ct);
                migrados++;
            }
            catch (Exception ex)
            {
                erros++;
                logger.LogError(ex, "[MigrarArquivosParaS3] Erro ao migrar imagem do post {PostId} (key {Key}).", post.Id, key);
            }
        }

        return (migrados, pulados, erros);
    }

    private async Task<(int Migrados, int Pulados, int Erros)> MigrarFotosContadorAsync(
        MinioStorageService minio, S3StorageService s3, string s3Bucket, CancellationToken ct)
    {
        int migrados = 0, pulados = 0, erros = 0;
        var contadores = await uow.Contadores.FindAsync(c => c.FotoUrl != null, ct);
        const string bucketOrigem = "veloxml";

        foreach (var contador in contadores)
        {
            var key = contador.FotoUrl!;
            try
            {
                if (await s3.ExistsAsync(key, s3Bucket, ct))
                {
                    pulados++;
                    continue;
                }

                await using var stream = await minio.DownloadAsync(key, bucketOrigem, ct);
                await s3.UploadAsync(stream, key, s3Bucket, "image/jpeg", ct);
                migrados++;
            }
            catch (Exception ex)
            {
                erros++;
                logger.LogError(ex, "[MigrarArquivosParaS3] Erro ao migrar foto do contador {ContadorId} (key {Key}).", contador.Id, key);
            }
        }

        return (migrados, pulados, erros);
    }
}
