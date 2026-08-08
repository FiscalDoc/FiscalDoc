using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ReenviarWebhookTransportadora;

public record ReenviarWebhookTransportadoraCommand(Guid ClienteId, Guid PedidoId) : IRequest<Result>;
