using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidos;

public sealed class GetPedidosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPedidosQuery, Result<PagedResult<PedidoDto>>>
{
    public async Task<Result<PagedResult<PedidoDto>>> Handle(GetPedidosQuery request, CancellationToken ct)
    {
        var paged = await uow.Pedidos.SearchAsync(
            request.ClienteId, request.Status, request.Page, request.PageSize, ct);

        var dto = PagedResult<PedidoDto>.Create(
            paged.Items.Select(CreatePedidoCommandHandler.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
