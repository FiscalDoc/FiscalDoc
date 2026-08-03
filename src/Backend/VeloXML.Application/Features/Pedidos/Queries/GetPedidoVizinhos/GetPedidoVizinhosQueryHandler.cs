using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoVizinhos;

public sealed class GetPedidoVizinhosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPedidoVizinhosQuery, Result<PedidoVizinhosDto>>
{
    public async Task<Result<PedidoVizinhosDto>> Handle(GetPedidoVizinhosQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.Id, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            return Result.Failure<PedidoVizinhosDto>(ResultError.NotFound("Pedido"));

        var (anteriorId, anteriorNumero, proximoId, proximoNumero) =
            await uow.Pedidos.GetVizinhosAsync(request.ClienteId, pedido.Numero, ct);

        return Result.Success(new PedidoVizinhosDto(anteriorId, anteriorNumero, proximoId, proximoNumero));
    }
}
