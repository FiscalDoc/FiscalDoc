using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public sealed class CreatePedidoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreatePedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(CreatePedidoCommand request, CancellationToken ct)
    {
        var itens = request.Itens.Select(i =>
        {
            var total = (i.Quantidade * i.PrecoUnitario) - i.Desconto;
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
            };
        }).ToList();

        var pedido = new Pedido
        {
            ClienteId = request.ClienteId,
            DestinatarioId = request.DestinatarioId,
            Observacoes = request.Observacoes,
            ValorTotal = itens.Sum(i => i.ValorTotal),
            Itens = itens,
        };

        await uow.Pedidos.AddAsync(pedido, ct);
        await uow.SaveChangesAsync(ct);

        var withDest = await uow.Pedidos.GetWithItensAsync(pedido.Id, ct);
        return Result.Success(ToDto(withDest!));
    }

    internal static PedidoDto ToDto(Pedido p) => new(
        p.Id, p.ClienteId, p.DestinatarioId,
        p.Destinatario?.RazaoSocial ?? string.Empty,
        p.Status, p.Observacoes, p.ValorTotal, p.CreatedAt,
        p.Itens.Select(i => new PedidoItemDto(
            i.Id, i.ProdutoId, i.Descricao, i.Unidade,
            i.Quantidade, i.PrecoUnitario, i.Desconto, i.ValorTotal,
            i.Cfop, i.Ncm, i.AliquotaIcms, i.AliquotaPis, i.AliquotaCofins
        )).ToList());
}
