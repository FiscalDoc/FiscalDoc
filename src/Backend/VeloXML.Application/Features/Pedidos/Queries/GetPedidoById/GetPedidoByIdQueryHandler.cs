using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoById;

public sealed class GetPedidoByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPedidoByIdQuery, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(GetPedidoByIdQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.Id, ct)
            ?? throw new NotFoundException("Pedido", request.Id);

        return Result.Success(CreatePedidoCommandHandler.ToDto(pedido));
    }
}
