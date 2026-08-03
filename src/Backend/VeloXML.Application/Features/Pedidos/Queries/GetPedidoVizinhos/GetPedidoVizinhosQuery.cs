using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoVizinhos;

public record GetPedidoVizinhosQuery(Guid ClienteId, Guid Id) : IRequest<Result<PedidoVizinhosDto>>;

public record PedidoVizinhosDto(Guid? AnteriorId, int? AnteriorNumero, Guid? ProximoId, int? ProximoNumero);
