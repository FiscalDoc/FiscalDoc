using System.Text.Json;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Application.Features.Documentos.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Pedidos.Common;

// Fecha o ciclo de uma emissão via Focus NFe — chamado tanto pelo comando autenticado
// (quando a Focus responde 201/autorizado na hora) quanto pelo webhook público e pelo job de
// polling (sem ICurrentUser/HttpContext), por isso nunca depende de ICurrentUser.
public sealed class NfeEmissaoFinalizer(
    IUnitOfWork uow, IStorageService storage, IFocusNfeService focusNfe, ILogger<NfeEmissaoFinalizer> logger)
{
    private const string BucketName = "documentos";

    public async Task FinalizarAsync(NfeEmissao emissao, Cliente cliente, FocusNfeSubmissaoResult resultado, CancellationToken ct)
    {
        // Idempotente de propósito: o webhook da Focus e o job de polling (ConsultarNfePendentesJob)
        // podem chegar quase ao mesmo tempo pra essa mesma emissão — sem essa checagem, a segunda
        // chamada duplicava Documento/PedidoHistorico inteiros (dois "NF-e nº X emitida" seguidos).
        if (emissao.Status is NfeEmissaoStatusEnum.Autorizada or NfeEmissaoStatusEnum.Rejeitada or NfeEmissaoStatusEnum.Erro)
        {
            logger.LogInformation("NfeEmissao {Id} já finalizada (status {Status}) — ignorando chamada duplicada de finalização.", emissao.Id, emissao.Status);
            return;
        }

        emissao.UltimoPayloadRespostaJson = resultado.RespostaBrutaJson;

        if (!resultado.Sucesso)
        {
            emissao.Status = NfeEmissaoStatusEnum.Rejeitada;
            emissao.MensagemErro = resultado.MensagemErro ?? "Não foi possível autorizar a emissão desta NF-e.";
            if (resultado.ErrosDetalhados is { Count: > 0 })
                emissao.ErrosDetalhadosJson = JsonSerializer.Serialize(resultado.ErrosDetalhados);
            uow.NfeEmissoes.Update(emissao);
            await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
            {
                TenantId    = emissao.TenantId,
                PedidoId    = emissao.PedidoId,
                Tipo        = "NfeRejeitada",
                Descricao   = $"NF-e rejeitada: {emissao.MensagemErro}",
                UsuarioNome = emissao.SolicitadoPorNome ?? "FiscalDoc",
            }, ct);
            await uow.SaveChangesAsync(ct);
            return;
        }

        var pedido = await uow.Pedidos.GetWithItensAsync(emissao.PedidoId, ct);
        if (pedido is null)
        {
            logger.LogWarning("NfeEmissao {Id} autorizada mas o Pedido {PedidoId} não existe mais", emissao.Id, emissao.PedidoId);
            emissao.Status = NfeEmissaoStatusEnum.Erro;
            emissao.MensagemErro = "Pedido não encontrado ao finalizar a emissão.";
            uow.NfeEmissoes.Update(emissao);
            await uow.SaveChangesAsync(ct);
            return;
        }

        var documento = new Documento
        {
            TenantId         = cliente.TenantId,
            ClienteId        = cliente.Id,
            Tipo             = TipoDocumentoEnum.NFe,
            OrigemImportacao = OrigemImportacaoEnum.FocusNfe,
            Numero           = resultado.Numero ?? string.Empty,
            DataEmissao      = DateTime.UtcNow,
        };

        if (!string.IsNullOrEmpty(resultado.CaminhoXml))
        {
            try
            {
                var xmlBytes = await focusNfe.BaixarArquivoAsync(cliente, resultado.CaminhoXml, ct);
                using var xmlStream = new MemoryStream(xmlBytes);
                var parsed = NfeXmlParser.Parse(xmlStream)
                    ?? throw new InvalidOperationException("XML autorizado pela Focus NFe não pôde ser interpretado.");
                await DocumentoParsedMapper.AplicarAsync(uow, documento, parsed, ct);

                var bucket = storage.ResolveBucket(BucketName);
                await storage.EnsureBucketExistsAsync(bucket, ct);
                var objectKey = StorageKeyHelper.MontarChaveDocumento(cliente.Cnpj, documento.DataEmissao, resultado.ChaveAcesso);
                xmlStream.Position = 0;
                await storage.UploadAsync(xmlStream, objectKey, bucket, "application/xml", ct);

                await uow.Arquivos.AddAsync(new Arquivo
                {
                    TenantId     = cliente.TenantId,
                    NomeArquivo  = Path.GetFileName(objectKey),
                    NomeOriginal = $"{resultado.ChaveAcesso ?? documento.Numero}.xml",
                    Bucket       = bucket,
                    ObjectKey    = objectKey,
                    MimeType     = "application/xml",
                    Tamanho      = xmlBytes.LongLength,
                    DocumentoId  = documento.Id,
                }, ct);
            }
            catch (Exception ex)
            {
                // A NF-e já foi autorizada pela SEFAZ nesse ponto — não falha a emissão por
                // causa disso, só loga pra investigar o download manualmente depois.
                logger.LogError(ex, "NF-e {ChaveAcesso} autorizada mas falhou ao baixar/gravar o XML", resultado.ChaveAcesso);
                documento.ChaveAcesso = resultado.ChaveAcesso;
                documento.ValorTotal  = pedido.ValorTotal;
                documento.Status      = StatusDocumentoEnum.Valido;
            }
        }
        else
        {
            documento.ChaveAcesso = resultado.ChaveAcesso;
            documento.ValorTotal  = pedido.ValorTotal;
            documento.Status      = StatusDocumentoEnum.Valido;
        }

        // DANFE oficial gerado pela própria Focus/SEFAZ — baixa e guarda igual ao XML, pra
        // servir esse PDF de verdade em vez de depender só do renderizador HTML próprio (que é
        // uma aproximação do layout, montada a partir do XML pra casos sem PDF disponível).
        if (!string.IsNullOrEmpty(resultado.CaminhoDanfe))
        {
            try
            {
                var pdfBytes = await focusNfe.BaixarArquivoAsync(cliente, resultado.CaminhoDanfe, ct);
                var bucket = storage.ResolveBucket(BucketName);
                await storage.EnsureBucketExistsAsync(bucket, ct);
                var objectKey = StorageKeyHelper.MontarChaveDocumento(cliente.Cnpj, documento.DataEmissao, resultado.ChaveAcesso, "pdf");
                using var pdfStream = new MemoryStream(pdfBytes);
                await storage.UploadAsync(pdfStream, objectKey, bucket, "application/pdf", ct);

                await uow.Arquivos.AddAsync(new Arquivo
                {
                    TenantId     = cliente.TenantId,
                    NomeArquivo  = Path.GetFileName(objectKey),
                    NomeOriginal = $"DANFE-{resultado.ChaveAcesso ?? documento.Numero}.pdf",
                    Bucket       = bucket,
                    ObjectKey    = objectKey,
                    MimeType     = "application/pdf",
                    Tamanho      = pdfBytes.LongLength,
                    DocumentoId  = documento.Id,
                }, ct);
            }
            catch (Exception ex)
            {
                // Mesma lógica do XML — a nota já está autorizada, não vale falhar a emissão
                // por causa do PDF. O frontend cai de volta pro renderizador HTML se este
                // arquivo não existir.
                logger.LogError(ex, "NF-e {ChaveAcesso} autorizada mas falhou ao baixar/gravar o DANFE", resultado.ChaveAcesso);
            }
        }

        await uow.Documentos.AddAsync(documento, ct);

        PedidoEmissaoHelper.VincularDocumentoAutorizado(pedido, documento);
        uow.Pedidos.Update(pedido);

        await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
        {
            TenantId    = pedido.TenantId,
            PedidoId    = pedido.Id,
            Tipo        = "EmitidoNfeFocus",
            Descricao   = $"NF-e nº {resultado.Numero} emitida",
            UsuarioNome = emissao.SolicitadoPorNome ?? "FiscalDoc",
        }, ct);

        emissao.Status      = NfeEmissaoStatusEnum.Autorizada;
        emissao.ChaveAcesso = resultado.ChaveAcesso;
        emissao.Numero      = resultado.Numero;
        emissao.Serie       = resultado.Serie;
        emissao.DocumentoId = documento.Id;
        uow.NfeEmissoes.Update(emissao);

        await uow.SaveChangesAsync(ct);
    }
}
