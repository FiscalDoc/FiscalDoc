using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;

public sealed class UpdatePedidoCommandHandler(IUnitOfWork uow, ILogger<UpdatePedidoCommandHandler> logger)
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
        pedido.Itens.Clear();

        var novosItens = request.Itens.Select(i =>
        {
            var total = (i.Quantidade * i.PrecoUnitario) - i.Desconto;
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
            };
        }).ToList();

        foreach (var item in novosItens) pedido.Itens.Add(item);
        pedido.ValorTotal = novosItens.Sum(i => i.ValorTotal);

        // Não chamar uow.Pedidos.Update(pedido) aqui: a entidade já está rastreada
        // (foi carregada nesta mesma unidade de trabalho via GetWithItensAsync).
        // DbSet.Update() percorre todo o grafo e, como os novos PedidoItem já têm
        // um Guid não-vazio gerado em memória, os classifica como "Modified" em vez
        // de "Added" — o EF então tenta fazer UPDATE de linhas que ainda não existem
        // no banco, afetando 0 linhas e lançando DbUpdateConcurrencyException.
        // Com o grafo já rastreado, o SaveChangesAsync detecta sozinho os itens
        // adicionados/removidos corretamente.
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} atualizado com {ItemCount} item(ns)", pedido.Id, novosItens.Count);

        return Result.Success(CreatePedidoCommandHandler.ToDto(pedido));
    }
}
