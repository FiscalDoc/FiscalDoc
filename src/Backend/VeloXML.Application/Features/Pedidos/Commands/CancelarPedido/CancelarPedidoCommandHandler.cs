using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CancelarPedido;

public sealed class CancelarPedidoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CancelarPedidoCommand, Result>
{
    public async Task<Result> Handle(CancelarPedidoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Pedido", request.Id);

        if (pedido.Status == "Cancelado")
            throw new DomainException("PEDIDO_JA_CANCELADO", "Pedido já está cancelado.");

        pedido.Status = "Cancelado";
        uow.Pedidos.Update(pedido);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
