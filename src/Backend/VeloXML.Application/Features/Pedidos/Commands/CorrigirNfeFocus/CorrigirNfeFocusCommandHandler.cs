using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CorrigirNfeFocus;

public sealed class CorrigirNfeFocusCommandHandler(
    IUnitOfWork uow,
    IFocusNfeService focusNfe,
    IStorageService storage,
    ICurrentUser currentUser,
    ILogger<CorrigirNfeFocusCommandHandler> logger) : IRequestHandler<CorrigirNfeFocusCommand, Result<CartaCorrecaoDto>>
{
    public async Task<Result<CartaCorrecaoDto>> Handle(CorrigirNfeFocusCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        var correcao = request.Correcao.Trim();

        var emissao = await uow.NfeEmissoes.GetLatestByPedidoAsync(pedido.Id, ct);
        if (emissao is null || emissao.Status != NfeEmissaoStatusEnum.Autorizada)
            return Result.Failure<CartaCorrecaoDto>(ResultError.Validation(
                "Status", "Só é possível emitir carta de correção para uma NF-e que já foi autorizada."));

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<CartaCorrecaoDto>(ResultError.NotFound("Cliente"));

        var resultado = await focusNfe.EnviarCartaCorrecaoAsync(cliente, emissao.Ref, correcao, ct);
        if (!resultado.Sucesso)
        {
            logger.LogWarning(
                "Carta de correção da NfeEmissao {Id} (ref {Ref}) rejeitada: {Erro}",
                emissao.Id, emissao.Ref, resultado.MensagemErro);
            return Result.Failure<CartaCorrecaoDto>(ResultError.Validation(
                "CartaCorrecao", resultado.MensagemErro ?? "Não foi possível enviar a carta de correção agora. Tente novamente em instantes."));
        }

        // A Focus devolve a sequência oficial da SEFAZ; se por algum motivo vier vazia, cai
        // pra contagem local (quantidade de CC-e já registradas nesse pedido + 1) só pra nomear
        // o arquivo — nunca é enviada de volta pra SEFAZ, então não precisa ser exata.
        var historicoExistente = await uow.PedidoHistoricos.GetByPedidoAsync(pedido.Id, ct);
        var sequenciaLocal = historicoExistente.Count(h => h.Tipo == "NfeCartaCorrecao") + 1;
        var sequencia = resultado.Sequencia ?? sequenciaLocal;

        if (emissao.DocumentoId.HasValue && !string.IsNullOrEmpty(resultado.CaminhoXmlCartaCorrecao))
        {
            var documento = await uow.Documentos.GetByIdAsync(emissao.DocumentoId.Value, ct);
            if (documento is not null)
            {
                try
                {
                    var xmlBytes = await focusNfe.BaixarArquivoAsync(cliente, resultado.CaminhoXmlCartaCorrecao, ct);
                    var bucket = storage.ResolveBucket("documentos");
                    await storage.EnsureBucketExistsAsync(bucket, ct);
                    var objectKey = StorageKeyHelper.MontarChaveDocumento(
                        cliente.Cnpj, documento.DataEmissao, $"{documento.ChaveAcesso}-cartacorrecao-{sequencia}", "xml");
                    using var xmlStream = new MemoryStream(xmlBytes);
                    await storage.UploadAsync(xmlStream, objectKey, bucket, "application/xml", ct);

                    await uow.Arquivos.AddAsync(new Arquivo
                    {
                        TenantId     = cliente.TenantId,
                        NomeArquivo  = Path.GetFileName(objectKey),
                        NomeOriginal = $"carta-correcao-{sequencia}-{documento.ChaveAcesso ?? documento.Numero}.xml",
                        Bucket       = bucket,
                        ObjectKey    = objectKey,
                        MimeType     = "application/xml",
                        Tamanho      = xmlBytes.LongLength,
                        DocumentoId  = documento.Id,
                    }, ct);
                }
                catch (Exception ex)
                {
                    // A carta já foi autorizada pela SEFAZ nesse ponto — não falha por causa
                    // disso, só loga pra investigar o download manualmente depois.
                    logger.LogError(ex, "Carta de correção nº{Sequencia} da NF-e {ChaveAcesso} autorizada mas falhou ao baixar/gravar o XML", sequencia, documento.ChaveAcesso);
                }
            }
        }

        await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
        {
            TenantId    = pedido.TenantId,
            PedidoId    = pedido.Id,
            Tipo        = "NfeCartaCorrecao",
            Descricao   = $"Carta de correção nº{sequencia} enviada: {correcao}",
            UsuarioNome = currentUser.Name ?? currentUser.Email ?? "FiscalDoc",
        }, ct);

        await uow.SaveChangesAsync(ct);

        return Result.Success(new CartaCorrecaoDto(resultado.Sequencia, resultado.ProtocoloCartaCorrecao, correcao, DateTime.UtcNow));
    }
}
