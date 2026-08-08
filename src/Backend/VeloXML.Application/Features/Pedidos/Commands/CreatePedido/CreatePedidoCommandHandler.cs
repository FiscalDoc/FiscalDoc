using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public sealed class CreatePedidoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ILogger<CreatePedidoCommandHandler> logger)
    : IRequestHandler<CreatePedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(CreatePedidoCommand request, CancellationToken ct)
    {
        var destinatarioValido = await uow.Destinatarios.ExistsAsync(
            d => d.Id == request.DestinatarioId && d.ClienteId == request.ClienteId, ct);
        if (!destinatarioValido)
        {
            logger.LogWarning("Pedido rejeitado: destinatário {DestinatarioId} não encontrado para o cliente {ClienteId}", request.DestinatarioId, request.ClienteId);
            return Result.Failure<PedidoDto>(ResultError.Validation("DestinatarioId", "Destinatário não encontrado ou não pertence a este cliente."));
        }

        if (request.TransportadoraId.HasValue)
        {
            var transportadoraValida = await uow.Transportadoras.ExistsAsync(
                t => t.Id == request.TransportadoraId.Value && t.ClienteId == request.ClienteId, ct);
            if (!transportadoraValida)
                return Result.Failure<PedidoDto>(ResultError.Validation("TransportadoraId", "Transportadora não encontrada ou não pertence a este cliente."));
        }

        var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtosValidos = await uow.Produtos.FindAsync(
            p => p.ClienteId == request.ClienteId && produtoIds.Contains(p.Id), ct);
        var produtoIdsFaltando = produtoIds.Except(produtosValidos.Select(p => p.Id)).ToList();
        if (produtoIdsFaltando.Count > 0)
        {
            logger.LogWarning("Pedido rejeitado: produto(s) {ProdutoIds} não encontrado(s) para o cliente {ClienteId}", produtoIdsFaltando, request.ClienteId);
            return Result.Failure<PedidoDto>(ResultError.Validation("ProdutoId", "Um ou mais produtos não foram encontrados ou não pertencem a este cliente."));
        }

        var itens = request.Itens.Select(i =>
        {
            var total = Math.Max(0, (i.Quantidade * i.PrecoUnitario) - i.Desconto);
            return new PedidoItem
            {
                ProdutoId = i.ProdutoId,
                Descricao = i.Descricao,
                Unidade = i.Unidade,
                Quantidade = i.Quantidade,
                PrecoUnitario = i.PrecoUnitario,
                Desconto = i.Desconto,
                ValorTotal = total,
                Cfop = i.Cfop,
                Ncm = i.Ncm,
                AliquotaIcms = i.AliquotaIcms,
                AliquotaPis = i.AliquotaPis,
                AliquotaCofins = i.AliquotaCofins,
                CstIcms = i.CstIcms,
                CstPis = i.CstPis,
                CstCofins = i.CstCofins,
                IcmsOrigem = i.IcmsOrigem,
                IbsCbsCst = i.IbsCbsCst,
                IbsCbsClassificacaoTributaria = i.IbsCbsClassificacaoTributaria,
            };
        }).ToList();

        var pedido = new Pedido
        {
            ClienteId = request.ClienteId,
            DestinatarioId = request.DestinatarioId,
            Observacoes = request.Observacoes,
            ValorTotal = itens.Sum(i => i.ValorTotal) + request.ValorFrete + request.ValorSeguro + request.ValorOutrasDespesas,
            Itens = itens,
            NaturezaOperacao = request.NaturezaOperacao,
            FinalidadeEmissao = request.FinalidadeEmissao,
            ModalidadeFrete = request.ModalidadeFrete,
            DataSaida = request.DataSaida,
            FormaPagamento = request.FormaPagamento,
            MeioPagamento = request.MeioPagamento,
            InformacoesComplementares = request.InformacoesComplementares,
            ConsumidorFinal = request.ConsumidorFinal,
            PresencaComprador = request.PresencaComprador,
            ValorFrete = request.ValorFrete,
            ValorSeguro = request.ValorSeguro,
            ValorOutrasDespesas = request.ValorOutrasDespesas,
            TransportadoraId = request.TransportadoraId,
        };

        await uow.Pedidos.AddAsync(pedido, ct);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} criado para o cliente {ClienteId} com {ItemCount} item(ns)", pedido.Id, request.ClienteId, itens.Count);

        await uow.PedidoHistoricos.AddAsync(PedidoHistoricoHelper.Criar(
            pedido.Id, pedido.TenantId, "Criado", "Pedido criado", currentUser), ct);
        await uow.SaveChangesAsync(ct);

        var withDest = await uow.Pedidos.GetWithItensAsync(pedido.Id, ct);
        return Result.Success(ToDto(withDest!));
    }

    internal static PedidoDto ToDto(Pedido p)
    {
        var danfe = DeserializarDanfe(p.Documento?.DanfeJson);
        return new(
            p.Id, p.Numero, p.ClienteId, p.DestinatarioId,
            p.Destinatario?.RazaoSocial ?? string.Empty,
            p.Destinatario?.CpfCnpj,
            p.Status, p.Observacoes, p.ValorTotal, p.CreatedAt,
            // Prioriza o cadastro ATUAL do Produto sobre a "foto" gravada no item quando ele foi
            // adicionado ao pedido — mesma lógica de EmitirNfeFocusCommandHandler/
            // FocusNfePayloadBuilder, senão completar o cadastro fiscal do produto DEPOIS de já
            // estar num pedido rascunho nunca aparece aqui (item expandido fica em branco).
            p.Itens.Select(i => new PedidoItemDto(
                i.Id, i.ProdutoId, i.Descricao, i.Unidade,
                i.Quantidade, i.PrecoUnitario, i.Desconto, i.ValorTotal,
                i.Produto?.Cfop ?? i.Cfop, i.Produto?.Ncm ?? i.Ncm, i.AliquotaIcms, i.AliquotaPis, i.AliquotaCofins,
                i.Produto?.CstIcms ?? i.CstIcms, i.Produto?.CstPis ?? i.CstPis, i.Produto?.CstCofins ?? i.CstCofins,
                i.Produto?.IcmsOrigem ?? i.IcmsOrigem,
                i.Produto?.IbsCbsCst ?? i.IbsCbsCst, i.Produto?.IbsCbsClassificacaoTributaria ?? i.IbsCbsClassificacaoTributaria
            )).ToList(),
            p.NaturezaOperacao, p.FinalidadeEmissao, p.ModalidadeFrete, p.DataSaida, p.FormaPagamento, p.MeioPagamento, p.InformacoesComplementares,
            p.ConsumidorFinal, p.PresencaComprador, p.ValorFrete, p.ValorSeguro, p.ValorOutrasDespesas,
            p.TransportadoraId, p.Transportadora?.RazaoSocial,
            p.DocumentoId, p.Documento?.Numero, danfe?.Serie, p.Documento?.ChaveAcesso, p.Documento?.OrigemImportacao.ToString(),
            p.Documento?.Status.ToString(), p.Documento?.DataEmissao, danfe?.ProtocoloAutorizacao, danfe?.DataAutorizacao,
            p.Documento?.MotivoCancelamento, p.Documento?.ProtocoloCancelamento, p.Documento?.DataCancelamento,
            p.Documento is null ? null : new DocumentoImpostosDto(
                p.Documento.ValorBaseCalculoIcms,
                p.Documento.ValorProdutos, p.Documento.ValorFrete, p.Documento.ValorSeguro, p.Documento.ValorDesconto,
                p.Documento.ValorIcms, p.Documento.ValorIpi, p.Documento.ValorPis, p.Documento.ValorCofins,
                p.Documento.ValorOutrasDespesas, p.Documento.ValorAproxTributos, p.Documento.ValorIbs, p.Documento.ValorCbs));
    }

    // DanfeJson só existe pra documentos com NFe real (emitida via Focus ou importada); nunca
    // falha o ToDto por causa disso, só não mostra protocolo/data se não der pra ler.
    private static DanfeDadosDto? DeserializarDanfe(string? danfeJson)
    {
        if (string.IsNullOrEmpty(danfeJson)) return null;
        try { return JsonSerializer.Deserialize<DanfeDadosDto>(danfeJson); }
        catch (JsonException) { return null; }
    }
}
