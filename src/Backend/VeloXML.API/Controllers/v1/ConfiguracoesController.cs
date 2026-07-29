using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Configuracoes.Commands.SaveSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SaveSocialConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SendConvite;
using VeloXML.Application.Features.Configuracoes.Commands.TestSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlStatus;
using VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;

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

    [HttpPost("smtp/test")]
    public async Task<IActionResult> TestSmtp([FromBody] TestSmtpConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpGet("social")]
    public async Task<IActionResult> GetSocial(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSocialConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("social")]
    public async Task<IActionResult> SaveSocial([FromBody] SaveSocialConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [AllowAnonymous]
    [HttpGet("social/public")]
    public async Task<IActionResult> GetSocialPublic(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSocialConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("convite")]
    public async Task<IActionResult> SendConvite([FromBody] SendConviteCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpGet("importacao-xml/status")]
    public async Task<IActionResult> GetImportacaoXmlStatus(CancellationToken ct)
    {
        var result = await mediator.Send(new GetImportacaoXmlStatusQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
