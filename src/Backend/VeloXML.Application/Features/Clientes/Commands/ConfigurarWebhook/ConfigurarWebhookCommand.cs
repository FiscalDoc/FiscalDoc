using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarWebhook;

public record ConfigurarWebhookCommand(Guid ClienteId, bool Habilitado, string? Url)
    : IRequest<Result<ClienteDto>>;
