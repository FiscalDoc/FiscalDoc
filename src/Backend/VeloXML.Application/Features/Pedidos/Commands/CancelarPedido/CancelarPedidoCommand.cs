using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CancelarPedido;

public record CancelarPedidoCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
