using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetDashboardStats;

public record GetDashboardStatsQuery(Guid? ClienteId, int UltimosDias = 30) : IRequest<Result<DashboardStatsDto>>;
