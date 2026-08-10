using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberResumo;

public record GetContaReceberResumoQuery(Guid ClienteId) : IRequest<Result<ContaReceberResumoDto>>;

public record ContaReceberResumoDto(decimal TotalPendente, decimal TotalAtrasado, decimal TotalPagoNoMes, int QtdPendente, int QtdAtrasado);
