using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateClienteFiscal;

public record UpdateClienteFiscalCommand(
    Guid ClienteId,
    string? RegimeTributario,
    string? InscricaoEstadual,
    string? InscricaoMunicipal,
    string? CnaePrincipal,
    string SerieNfe,
    bool NfeHabilitado
) : IRequest<Result<ClienteDto>>;
