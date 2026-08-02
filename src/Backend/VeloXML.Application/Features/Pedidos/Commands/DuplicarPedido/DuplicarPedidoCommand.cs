using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.DuplicarPedido;

public record DuplicarPedidoCommand(Guid Id, Guid ClienteId) : IRequest<Result<PedidoDto>>;
