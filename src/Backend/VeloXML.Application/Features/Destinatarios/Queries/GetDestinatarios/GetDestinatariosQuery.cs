using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;

public record GetDestinatariosQuery(
    Guid ClienteId,
    string? Termo,
    bool? Ativo = null,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<DestinatarioDto>>>;
