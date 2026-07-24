using System.Security.Cryptography;
using AutoMapper;
using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.UploadDocumento;

public sealed class UploadDocumentoCommandHandler(
    IUnitOfWork uow,
    ICurrentUser currentUser,
    IStorageService storage,
    IWebhookService webhook,
    IMapper mapper) : IRequestHandler<UploadDocumentoCommand, Result<DocumentoDto>>
{
    private const string BucketName = "documentos";

    public async Task<Result<DocumentoDto>> Handle(UploadDocumentoCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<DocumentoDto>(ResultError.NotFound("Cliente"));

        await storage.EnsureBucketExistsAsync(BucketName, ct);

        var hash = await ComputeHashAsync(request.Arquivo.Content, ct);
        request.Arquivo.Content.Position = 0;

        var objectKey = $"documentos/{request.ClienteId}/{request.Tipo.ToString().ToLower()}/{Guid.NewGuid()}/{request.Arquivo.FileName}";
        var url = await storage.UploadAsync(request.Arquivo.Content, objectKey, BucketName, request.Arquivo.ContentType, ct);

        var documento = new Documento
        {
            TenantId    = currentUser.TenantId!.Value,
            ClienteId   = request.ClienteId,
            Tipo        = request.Tipo,
            Numero      = Path.GetFileNameWithoutExtension(request.Arquivo.FileName),
            DataEmissao = DateTime.UtcNow,
            CreatedBy   = currentUser.Email
        };

        // Parse XML metadata when applicable
        var isXml = request.Arquivo.ContentType.Contains("xml", StringComparison.OrdinalIgnoreCase)
                 || request.Arquivo.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase);

        if (isXml)
        {
            request.Arquivo.Content.Position = 0;
            var parsed = NfeXmlParser.Parse(request.Arquivo.Content);
            request.Arquivo.Content.Position = 0;

            if (parsed != null)
            {
                documento.Numero           = parsed.Numero.TrimStart('0').PadLeft(1, '0');
                documento.ChaveAcesso      = parsed.ChaveAcesso;
                documento.CnpjEmitente     = parsed.CnpjEmitente;
                documento.NomeEmitente     = parsed.NomeEmitente;
                documento.CnpjDestinatario = parsed.CnpjDestinatario;
                documento.NomeDestinatario = parsed.NomeDestinatario;
                documento.DataEmissao      = parsed.DataEmissao;
                documento.ValorTotal       = parsed.ValorTotal;

                if (!string.IsNullOrEmpty(parsed.ChaveAcesso))
                {
                    var existente = await uow.Documentos.GetByChaveAcessoAsync(parsed.ChaveAcesso, ct);
                    if (existente != null)
                    {
                        documento.Status     = Domain.Enums.StatusDocumentoEnum.Duplicado;
                        documento.Observacao = $"Duplicata do documento {existente.Id}";
                    }
                    else
                    {
                        documento.Status = Domain.Enums.StatusDocumentoEnum.Valido;
                    }
                }
                else
                {
                    documento.Status = Domain.Enums.StatusDocumentoEnum.Valido;
                }
            }
        }

        var arquivo = new Arquivo
        {
            TenantId    = currentUser.TenantId!.Value,
            NomeArquivo = Path.GetFileName(objectKey),
            NomeOriginal = request.Arquivo.FileName,
            Bucket      = BucketName,
            ObjectKey   = objectKey,
            MimeType    = request.Arquivo.ContentType,
            Hash        = hash,
            Url         = url,
            Tamanho     = request.Arquivo.Size
        };

        await uow.Documentos.AddAsync(documento, ct);
        arquivo.DocumentoId = documento.Id;
        await uow.Arquivos.AddAsync(arquivo, ct);
        await uow.SaveChangesAsync(ct);

        var dto = mapper.Map<DocumentoDto>(documento);
        _ = webhook.NotifyDocumentoAsync(request.ClienteId, new
        {
            evento      = "documento.recebido",
            documentoId = documento.Id,
            tipo        = documento.Tipo.ToString(),
            status      = documento.Status.ToString(),
            chaveAcesso = documento.ChaveAcesso,
            numero      = documento.Numero,
            emitente    = documento.NomeEmitente,
            valor       = documento.ValorTotal,
            dataEmissao = documento.DataEmissao
        }, CancellationToken.None);

        return Result.Success(dto);
    }

    private static async Task<string> ComputeHashAsync(Stream stream, CancellationToken ct)
    {
        var bytes = await SHA256.HashDataAsync(stream, ct);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
