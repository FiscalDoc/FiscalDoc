using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.DeletePedido;

public record DeletePedidoCommand(Guid Id, Guid ClienteId) : IRequest<Result>;
