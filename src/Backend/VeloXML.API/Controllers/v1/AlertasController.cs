using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Alertas.Commands.MarcarAlertaLido;
using VeloXML.Application.Features.Alertas.Queries.GetAlertas;
using VeloXML.Domain.Enums;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/alertas")]
[Authorize]
public sealed class AlertasController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? clienteId, [FromQuery] StatusAlertaEnum? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetAlertasQuery(clienteId, status, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPatch("{id:guid}/lido")]
    public async Task<IActionResult> MarcarLido(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new MarcarAlertaLidoCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }
}
