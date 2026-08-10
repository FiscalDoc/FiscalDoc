using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContasReceber;

public record GetContasReceberQuery(
    Guid ClienteId,
    string? Status,
    DateTime? De,
    DateTime? Ate,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<ContaReceberDto>>>;
