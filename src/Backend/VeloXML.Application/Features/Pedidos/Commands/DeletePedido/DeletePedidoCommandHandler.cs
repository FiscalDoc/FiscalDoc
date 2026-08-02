using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.DeletePedido;

public sealed class DeletePedidoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeletePedidoCommand, Result>
{
    public async Task<Result> Handle(DeletePedidoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.Id, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.Id);

        if (pedido.Status != "Rascunho")
            return Result.Failure(ResultError.Validation("Status", "Apenas pedidos em rascunho podem ser excluídos. Pedidos emitidos devem ser cancelados."));

        uow.Pedidos.Remove(pedido);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
