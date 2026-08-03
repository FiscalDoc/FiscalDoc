using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.DuplicarPedido;

public sealed class DuplicarPedidoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ILogger<DuplicarPedidoCommandHandler> logger)
    : IRequestHandler<DuplicarPedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(DuplicarPedidoCommand request, CancellationToken ct)
    {
        var original = await uow.Pedidos.GetWithItensAsync(request.Id, ct);
        if (original is null || original.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.Id);

        var itens = original.Itens.Select(i => new PedidoItem
        {
            ProdutoId = i.ProdutoId,
            Descricao = i.Descricao,
            Unidade = i.Unidade,
            Quantidade = i.Quantidade,
            PrecoUnitario = i.PrecoUnitario,
            Desconto = i.Desconto,
            ValorTotal = i.ValorTotal,
            Cfop = i.Cfop,
            Ncm = i.Ncm,
            AliquotaIcms = i.AliquotaIcms,
            AliquotaPis = i.AliquotaPis,
            AliquotaCofins = i.AliquotaCofins,
        }).ToList();

        // Numero é gerado pelo sequence do banco (ValueGeneratedOnAdd) — nunca copiado do original.
        var copia = new Pedido
        {
            ClienteId = original.ClienteId,
            DestinatarioId = original.DestinatarioId,
            Status = "Rascunho",
            Observacoes = original.Observacoes,
            ValorTotal = itens.Sum(i => i.ValorTotal),
            Itens = itens,
            NaturezaOperacao = original.NaturezaOperacao,
            DataSaida = null,
            FormaPagamento = original.FormaPagamento,
            MeioPagamento = original.MeioPagamento,
            InformacoesComplementares = original.InformacoesComplementares,
        };

        await uow.Pedidos.AddAsync(copia, ct);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} duplicado a partir do pedido {OriginalId} (nº {NumeroOriginal})",
            copia.Id, original.Id, original.Numero);

        await uow.PedidoHistoricos.AddAsync(PedidoHistoricoHelper.Criar(
            copia.Id, copia.TenantId, "Criado", $"Pedido duplicado a partir do pedido nº {original.Numero}", currentUser), ct);
        await uow.SaveChangesAsync(ct);

        var withDest = await uow.Pedidos.GetWithItensAsync(copia.Id, ct);
        return Result.Success(CreatePedidoCommandHandler.ToDto(withDest!));
    }
}
