using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;

public sealed class UpdatePedidoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdatePedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(UpdatePedidoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.Id, ct)
            ?? throw new NotFoundException("Pedido", request.Id);

        if (pedido.Status != "Rascunho")
            throw new DomainException("PEDIDO_NAO_EDITAVEL", "Apenas pedidos em rascunho podem ser editados.");

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

        uow.Pedidos.Update(pedido);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreatePedidoCommandHandler.ToDto(pedido));
    }
}
