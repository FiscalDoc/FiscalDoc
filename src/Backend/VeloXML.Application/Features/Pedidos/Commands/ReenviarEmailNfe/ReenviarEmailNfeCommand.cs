using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ReenviarEmailNfe;

public record ReenviarEmailNfeCommand(Guid ClienteId, Guid PedidoId) : IRequest<Result>;
