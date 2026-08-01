using System.Security.Cryptography;
using AutoMapper;
using MediatR;
using VeloXML.Application.Common;
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
        // Parse XML metadata primeiro (precisamos do CNPJ do destinatário pra resolver o cliente)
        var isXml = request.Arquivo.ContentType.Contains("xml", StringComparison.OrdinalIgnoreCase)
                 || request.Arquivo.FileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase);

        ParsedDocumento? parsed = null;
        if (isXml)
        {
            request.Arquivo.Content.Position = 0;
            parsed = NfeXmlParser.Parse(request.Arquivo.Content);
            request.Arquivo.Content.Position = 0;
        }

        var cliente = await ResolverClienteAsync(request.ClienteId, parsed, ct);
        if (cliente.IsFailure)
            return Result.Failure<DocumentoDto>(cliente.Error);

        if (!cliente.Value.Ativo)
            return Result.Failure<DocumentoDto>(ResultError.Validation("Cliente", "Não é possível importar notas fiscais para um cliente inativo."));

        var bucket = storage.ResolveBucket(BucketName);
        await storage.EnsureBucketExistsAsync(bucket, ct);

        var hash = await ComputeHashAsync(request.Arquivo.Content, ct);
        request.Arquivo.Content.Position = 0;

        var objectKey = StorageKeyHelper.MontarChaveDocumento(
            cliente.Value.Cnpj, parsed?.DataEmissao ?? DateTime.UtcNow, parsed?.ChaveAcesso);
        await storage.UploadAsync(request.Arquivo.Content, objectKey, bucket, request.Arquivo.ContentType, ct);

        var documento = new Documento
        {
            TenantId    = cliente.Value.TenantId,
            ClienteId   = cliente.Value.Id,
            Tipo        = request.Tipo,
            Numero      = Path.GetFileNameWithoutExtension(request.Arquivo.FileName),
            DataEmissao = DateTime.UtcNow,
            CreatedBy   = currentUser.Email
        };

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

        var arquivo = new Arquivo
        {
            TenantId    = cliente.Value.TenantId,
            NomeArquivo = Path.GetFileName(objectKey),
            NomeOriginal = request.Arquivo.FileName,
            Bucket      = bucket,
            ObjectKey   = objectKey,
            MimeType    = request.Arquivo.ContentType,
            Hash        = hash,
            // Sem URL persistida de propósito — uma pre-signed URL expira, e
            // DocumentosController já baixa sempre via Bucket/ObjectKey sob demanda
            // (storage.DownloadAsync), nunca lendo este campo.
            Url         = null,
            Tamanho     = request.Arquivo.Size
        };

        await uow.Documentos.AddAsync(documento, ct);
        arquivo.DocumentoId = documento.Id;
        await uow.Arquivos.AddAsync(arquivo, ct);
        await uow.SaveChangesAsync(ct);

        var dto = mapper.Map<DocumentoDto>(documento);
        _ = webhook.NotifyDocumentoAsync(cliente.Value.Id, new
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

    private async Task<Result<Cliente>> ResolverClienteAsync(Guid? clienteId, ParsedDocumento? parsed, CancellationToken ct)
    {
        // Usuário logado como Cliente: a importação é sempre pro próprio cliente, ignorando
        // qualquer ClienteId enviado ou CNPJ detectado no XML — não faz sentido esse perfil
        // escolher/mirar outro cliente.
        if (currentUser.ClienteId.HasValue)
        {
            var proprioCliente = await uow.Clientes.GetByIdAsync(currentUser.ClienteId.Value, ct);
            return proprioCliente is null
                ? Result.Failure<Cliente>(ResultError.NotFound("Cliente"))
                : Result.Success(proprioCliente);
        }

        if (clienteId.HasValue)
        {
            var cliente = await uow.Clientes.GetByIdAsync(clienteId.Value, ct);
            return cliente is null
                ? Result.Failure<Cliente>(ResultError.NotFound("Cliente"))
                : Result.Success(cliente);
        }

        var cnpjDestinatario = parsed?.CnpjDestinatario;
        if (string.IsNullOrWhiteSpace(cnpjDestinatario))
            return Result.Failure<Cliente>(ResultError.Validation("ClienteId", "Selecione o cliente para este arquivo."));

        var cnpjLimpo = new string(cnpjDestinatario.Where(char.IsDigit).ToArray());
        var existente = await uow.Clientes.GetByCnpjAsync(cnpjLimpo, ct);
        if (existente != null)
            return Result.Success(existente);

        if (currentUser.ContadorId is null)
            return Result.Failure<Cliente>(ResultError.Validation(
                "ClienteId", "Não foi possível identificar o cliente. Selecione manualmente ou peça para um contador importar."));

        var novoCliente = new Cliente
        {
            TenantId     = currentUser.TenantId!.Value,
            RazaoSocial  = parsed!.NomeDestinatario ?? cnpjLimpo,
            Cnpj         = cnpjLimpo,
            ContadorId   = currentUser.ContadorId.Value,
            CreatedBy    = currentUser.Email
        };
        await uow.Clientes.AddAsync(novoCliente, ct);
        return Result.Success(novoCliente);
    }

    private static async Task<string> ComputeHashAsync(Stream stream, CancellationToken ct)
    {
        var bytes = await SHA256.HashDataAsync(stream, ct);
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
