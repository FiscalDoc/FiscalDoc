using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoById;

public record GetPedidoByIdQuery(Guid Id, Guid ClienteId) : IRequest<Result<PedidoDto>>;
