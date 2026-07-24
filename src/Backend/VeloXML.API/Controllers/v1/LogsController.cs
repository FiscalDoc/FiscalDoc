using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Logs.Queries.GetLogs;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/logs")]
[Authorize(Roles = "Administrador")]
public sealed class LogsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? categoria,
        [FromQuery] string? operacao,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetLogsQuery(categoria, operacao, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
