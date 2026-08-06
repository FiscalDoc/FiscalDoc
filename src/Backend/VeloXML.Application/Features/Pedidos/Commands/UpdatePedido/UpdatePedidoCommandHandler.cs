using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;

public sealed class UpdatePedidoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ILogger<UpdatePedidoCommandHandler> logger)
    : IRequestHandler<UpdatePedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(UpdatePedidoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.Id, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.Id);

        if (pedido.Status != "Rascunho")
            throw new DomainException("PEDIDO_NAO_EDITAVEL", "Apenas pedidos em rascunho podem ser editados.");

        var destinatarioValido = await uow.Destinatarios.ExistsAsync(
            d => d.Id == request.DestinatarioId && d.ClienteId == pedido.ClienteId, ct);
        if (!destinatarioValido)
        {
            logger.LogWarning("Atualização de pedido {PedidoId} rejeitada: destinatário {DestinatarioId} não encontrado", request.Id, request.DestinatarioId);
            return Result.Failure<PedidoDto>(ResultError.Validation("DestinatarioId", "Destinatário não encontrado ou não pertence a este cliente."));
        }

        var produtoIds = request.Itens.Select(i => i.ProdutoId).Distinct().ToList();
        var produtosValidos = await uow.Produtos.FindAsync(
            p => p.ClienteId == pedido.ClienteId && produtoIds.Contains(p.Id), ct);
        var produtoIdsFaltando = produtoIds.Except(produtosValidos.Select(p => p.Id)).ToList();
        if (produtoIdsFaltando.Count > 0)
        {
            logger.LogWarning("Atualização de pedido {PedidoId} rejeitada: produto(s) {ProdutoIds} não encontrado(s)", request.Id, produtoIdsFaltando);
            return Result.Failure<PedidoDto>(ResultError.Validation("ProdutoId", "Um ou mais produtos não foram encontrados ou não pertencem a este cliente."));
        }

        pedido.DestinatarioId = request.DestinatarioId;
        pedido.Observacoes = request.Observacoes;
        pedido.NaturezaOperacao = request.NaturezaOperacao;
        pedido.FinalidadeEmissao = request.FinalidadeEmissao;
        pedido.ModalidadeFrete = request.ModalidadeFrete;
        pedido.DataSaida = request.DataSaida;
        pedido.FormaPagamento = request.FormaPagamento;
        pedido.MeioPagamento = request.MeioPagamento;
        pedido.InformacoesComplementares = request.InformacoesComplementares;
        pedido.ConsumidorFinal = request.ConsumidorFinal;
        pedido.PresencaComprador = request.PresencaComprador;
        pedido.ValorFrete = request.ValorFrete;
        pedido.ValorSeguro = request.ValorSeguro;
        pedido.ValorOutrasDespesas = request.ValorOutrasDespesas;

        var itensAntigos = pedido.Itens.ToList();

        var novosItens = request.Itens.Select(i =>
        {
            var total = Math.Max(0, (i.Quantidade * i.PrecoUnitario) - i.Desconto);
            return new PedidoItem
            {
                PedidoId = pedido.Id,
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

        // Marca Remove/Add explicitamente no repositório em vez de Itens.Clear()+Add():
        // nesse fluxo (troca de coleção junto com outras mudanças no Pedido pai no
        // mesmo SaveChanges), o EF Core pode classificar os itens novos como
        // "Modified" em vez de "Added", gerando UPDATE de linhas inexistentes
        // (DbUpdateConcurrencyException: 0 rows affected).
        uow.Pedidos.SubstituirItens(itensAntigos, novosItens);

        pedido.Itens = novosItens;
        pedido.ValorTotal = novosItens.Sum(i => i.ValorTotal) + request.ValorFrete + request.ValorSeguro + request.ValorOutrasDespesas;

        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} atualizado com {ItemCount} item(ns)", pedido.Id, novosItens.Count);

        if (request.Origem == "manual")
        {
            await uow.PedidoHistoricos.AddAsync(PedidoHistoricoHelper.Criar(
                pedido.Id, pedido.TenantId, "Editado", "Pedido editado", currentUser), ct);
            await uow.SaveChangesAsync(ct);
        }

        return Result.Success(CreatePedidoCommandHandler.ToDto(pedido));
    }
}
