using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarImap;

public record ConfigurarImapCommand(
    Guid ClienteId,
    bool Habilitado,
    string? Host,
    int Port,
    string? Email,
    string? Senha
) : IRequest<Result<ClienteDto>>;
