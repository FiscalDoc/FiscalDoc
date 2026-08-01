using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlLogs;
using VeloXML.Application.Features.Logs.Queries.GetLogs;
using VeloXML.Domain.Enums;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/logs")]
[Authorize]
public sealed class LogsController(IMediator mediator) : ControllerBase
{
    [Authorize(Roles = "Administrador")]
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

    // Sem restrição de Roles de propósito: qualquer usuário autenticado (Admin ou Contador) pode
    // consultar — o handler já recorta pra só mostrar os clientes que esse usuário pode ver.
    [HttpGet("integracao")]
    public async Task<IActionResult> GetIntegracao(
        [FromQuery] Guid? clienteId,
        [FromQuery] OrigemImportacaoEnum? origem,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetImportacaoXmlLogsQuery(clienteId, origem, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("integracao/resumo")]
    public async Task<IActionResult> GetIntegracaoResumo([FromQuery] OrigemImportacaoEnum? origem, CancellationToken ct)
    {
        var result = await mediator.Send(new GetImportacaoXmlLogsResumoQuery(origem), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
