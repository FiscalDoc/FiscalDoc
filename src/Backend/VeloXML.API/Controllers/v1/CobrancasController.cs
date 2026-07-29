using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Contadores.Commands.CriarCobrancaManual;
using VeloXML.Application.Features.Contadores.Commands.MarcarCobrancaPaga;
using VeloXML.Application.Features.Contadores.Commands.ReabrirCobranca;
using VeloXML.Application.Features.Contadores.Queries.GetCobrancas;
using VeloXML.Application.Features.Contadores.Queries.GetCobrancasResumo;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/cobrancas")]
[Authorize(Roles = "Administrador")]
public sealed class CobrancasController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? termo,
        [FromQuery] string? tipo,
        [FromQuery] string? status,
        [FromQuery] int? mes,
        [FromQuery] int? ano,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetCobrancasQuery(termo, tipo, status, mes, ano, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> GetResumo(CancellationToken ct)
    {
        var result = await mediator.Send(new GetCobrancasResumoQuery(), ct);
        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CriarCobrancaManualCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/pagar")]
    public async Task<IActionResult> MarcarPaga(Guid id, [FromBody] MarcarPagaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new MarcarCobrancaPagaCommand(id, body.Observacao), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/reabrir")]
    public async Task<IActionResult> Reabrir(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new ReabrirCobrancaCommand(id), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
