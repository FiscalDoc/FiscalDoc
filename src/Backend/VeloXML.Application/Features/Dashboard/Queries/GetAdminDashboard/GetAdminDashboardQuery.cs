using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetAdminDashboard;

public record GetAdminDashboardQuery : IRequest<Result<AdminDashboardDto>>;
