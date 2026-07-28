using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.EmitirPedido;

public record EmitirPedidoCommand(Guid Id, Guid ClienteId) : IRequest<Result<PedidoDto>>;
