using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetClienteDashboard;

public record GetClienteDashboardQuery(Guid ClienteId) : IRequest<Result<ClienteDashboardDto>>;
