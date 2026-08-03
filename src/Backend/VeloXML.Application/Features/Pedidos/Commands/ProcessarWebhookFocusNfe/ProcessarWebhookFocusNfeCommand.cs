using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ProcessarWebhookFocusNfe;

public record ProcessarWebhookFocusNfeCommand(string Ref) : IRequest<Result>;
