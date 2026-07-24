using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Alertas.Queries.GetAlertas;

public record GetAlertasQuery(Guid? ClienteId, StatusAlertaEnum? Status, int Page = 1, int PageSize = 20)
    : IRequest<Result<PagedResult<AlertaDto>>>;
