using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Configuracoes.Commands.SaveSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/configuracoes")]
[Authorize(Roles = "Administrador")]
public sealed class ConfiguracoesController(IMediator mediator) : ControllerBase
{
    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtp(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSmtpConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("smtp")]
    public async Task<IActionResult> SaveSmtp([FromBody] SaveSmtpConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
