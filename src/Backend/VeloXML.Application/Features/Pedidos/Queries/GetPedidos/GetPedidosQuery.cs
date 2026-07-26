using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidos;

public record GetPedidosQuery(
    Guid ClienteId,
    string? Status,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<PedidoDto>>>;
