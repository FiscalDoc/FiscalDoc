using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoras;

public record GetTransportadorasQuery(
    Guid ClienteId,
    string? Termo,
    bool? Ativo = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<TransportadoraDto>>>;
