using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidosResumo;

public record GetPedidosResumoQuery(Guid ClienteId) : IRequest<Result<PedidosResumoDto>>;
