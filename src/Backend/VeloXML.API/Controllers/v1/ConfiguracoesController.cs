using Hangfire;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Configuracoes.Commands.SaveFocusNfeConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SaveGroqConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SaveIntervaloImportacao;
using VeloXML.Application.Features.Configuracoes.Commands.SaveSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SaveSocialConfig;
using VeloXML.Application.Features.Configuracoes.Commands.SendConvite;
using VeloXML.Application.Features.Configuracoes.Commands.TestSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetFocusNfeConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetGroqConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlStatus;
using VeloXML.Application.Features.Configuracoes.Queries.GetIntervaloImportacao;
using VeloXML.Application.Features.Configuracoes.Queries.GetSmtpConfig;
using VeloXML.Application.Features.Configuracoes.Queries.GetSocialConfig;
using VeloXML.Infrastructure.Jobs;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/configuracoes")]
[Authorize]
public sealed class ConfiguracoesController(IMediator mediator) : ControllerBase
{
    [Authorize(Roles = "Administrador")]
    [HttpGet("smtp")]
    public async Task<IActionResult> GetSmtp(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSmtpConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [Authorize(Roles = "Administrador")]
    [HttpPut("smtp")]
    public async Task<IActionResult> SaveSmtp([FromBody] SaveSmtpConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [Authorize(Roles = "Administrador")]
    [HttpPost("smtp/test")]
    public async Task<IActionResult> TestSmtp([FromBody] TestSmtpConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [Authorize(Roles = "Administrador")]
    [HttpGet("social")]
    public async Task<IActionResult> GetSocial(CancellationToken ct)
    {
        var result = await mediator.Send(new GetSocialConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [Authorize(Roles = "Administrador")]
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

    [Authorize(Roles = "Administrador")]
    [HttpPost("convite")]
    public async Task<IActionResult> SendConvite([FromBody] SendConviteCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    // Sem restrição de Roles de propósito: qualquer usuário autenticado (Admin ou Contador) pode
    // consultar — o handler já recorta a lista de clientes pra só mostrar o que esse usuário
    // pode ver, reaproveitando o mesmo filtro multi-tenant usado no resto do sistema.
    [HttpGet("importacao-xml/status")]
    public async Task<IActionResult> GetImportacaoXmlStatus(CancellationToken ct)
    {
        var result = await mediator.Send(new GetImportacaoXmlStatusQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    // O histórico/resumo de execuções (importacao-xml/logs*) foi migrado pra LogsController
    // (api/v1/logs/integracao*) — tudo de log centralizado num único lugar na tela de Logs.

    [Authorize(Roles = "Administrador")]
    [HttpPost("importacao-xml/forcar")]
    public IActionResult ForcarImportacaoXml()
    {
        RecurringJob.TriggerJob(ImportarXmlEmailJob.JobId);
        return Ok();
    }

    [Authorize(Roles = "Administrador")]
    [HttpGet("importacao-xml/intervalo")]
    public async Task<IActionResult> GetIntervaloImportacao(CancellationToken ct)
    {
        var result = await mediator.Send(new GetIntervaloImportacaoQuery(), ct);
        return Ok(new { intervaloMinutos = result.Value });
    }

    [Authorize(Roles = "Administrador")]
    [HttpPut("importacao-xml/intervalo")]
    public async Task<IActionResult> SaveIntervaloImportacao([FromBody] SaveIntervaloImportacaoCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        if (!result.IsSuccess) return BadRequest(result.Error);

        // Reagenda o job em produção imediatamente, sem precisar reiniciar a API.
        RecurringJob.AddOrUpdate<ImportarXmlEmailJob>(
            ImportarXmlEmailJob.JobId,
            job => job.ExecuteAsync(CancellationToken.None),
            $"*/{result.Value} * * * *");

        return Ok(new { intervaloMinutos = result.Value });
    }

    // Execução única (não recorrente) — dispara via BackgroundJob, não RecurringJob, já que só
    // roda uma vez por decisão manual do admin, não precisa de agendamento.
    [Authorize(Roles = "Administrador")]
    [HttpPost("storage/migrar-s3")]
    public IActionResult MigrarArquivosParaS3()
    {
        BackgroundJob.Enqueue<MigrarArquivosParaS3Job>(job => job.ExecuteAsync(CancellationToken.None));
        return Ok();
    }

    [Authorize(Roles = "Administrador")]
    [HttpGet("focus-nfe")]
    public async Task<IActionResult> GetFocusNfe(CancellationToken ct)
    {
        var result = await mediator.Send(new GetFocusNfeConfigQuery(), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [Authorize(Roles = "Administrador")]
    [HttpPut("focus-nfe")]
    public async Task<IActionResult> SaveFocusNfe([FromBody] SaveFocusNfeConfigCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
