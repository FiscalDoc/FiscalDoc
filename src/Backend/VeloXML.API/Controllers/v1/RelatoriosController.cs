using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfeEmitidas;
using VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfePorCliente;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Authorize]
public sealed class RelatoriosController(IMediator mediator) : ControllerBase
{
    // Relatório mensal de NF-e emitidas de UM cliente específico (usuário, data, número, série)
    // — vai na tela de Relatórios do próprio Cliente, mas Contador/Administrador também acessam
    // (o filtro de acesso já acontece no query filter global de Cliente, dentro do handler).
    [HttpGet("api/v1/clientes/{clienteId:guid}/relatorios/nfe-emitidas")]
    public async Task<IActionResult> GetNfeEmitidas(Guid clienteId, [FromQuery] int mes, [FromQuery] int ano, CancellationToken ct)
    {
        var result = await mediator.Send(new GetRelatorioNfeEmitidasQuery(clienteId, mes, ano), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    // Relatório mensal agregado por cliente (quantas notas cada cliente emitiu) — só
    // Administrador, é uma visão global entre todos os clientes/tenants.
    [Authorize(Roles = "Administrador")]
    [HttpGet("api/v1/relatorios/nfe-por-cliente")]
    public async Task<IActionResult> GetNfePorCliente([FromQuery] int mes, [FromQuery] int ano, CancellationToken ct)
    {
        var result = await mediator.Send(new GetRelatorioNfePorClienteQuery(mes, ano), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
