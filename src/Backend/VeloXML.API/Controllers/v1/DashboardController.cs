using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Dashboard.Queries.GetAdminDashboard;
using VeloXML.Application.Features.Dashboard.Queries.GetDashboardStats;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public sealed class DashboardController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStats([FromQuery] Guid? clienteId, [FromQuery] int ultimosDias = 30, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDashboardStatsQuery(clienteId, ultimosDias), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GetAdminStats(CancellationToken ct)
    {
        var result = await mediator.Send(new GetAdminDashboardQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
