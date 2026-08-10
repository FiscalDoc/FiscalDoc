using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.ContasReceber.Commands.CancelarContaReceber;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.Application.Features.ContasReceber.Commands.DarBaixaContaReceber;
using VeloXML.Application.Features.ContasReceber.Commands.DeleteContaReceber;
using VeloXML.Application.Features.ContasReceber.Commands.UpdateContaReceber;
using VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberById;
using VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberResumo;
using VeloXML.Application.Features.ContasReceber.Queries.GetContasReceber;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/contas-receber")]
[Authorize]
public sealed class ContasReceberController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? status, [FromQuery] DateTime? de, [FromQuery] DateTime? ate,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetContasReceberQuery(clienteId, status, de, ate, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("resumo")]
    public async Task<IActionResult> GetResumo(Guid clienteId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetContaReceberResumoQuery(clienteId), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetContaReceberByIdQuery(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreateContaReceberRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateContaReceberCommand(
            clienteId, body.DestinatarioId, body.PedidoId, body.Descricao, body.ValorTotal, body.DataVencimento, body.Observacao), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateContaReceberRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateContaReceberCommand(
            id, clienteId, body.DestinatarioId, body.PedidoId, body.Descricao, body.ValorTotal, body.DataVencimento, body.Observacao), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteContaReceberCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/baixa")]
    public async Task<IActionResult> DarBaixa(Guid clienteId, Guid id, [FromBody] DarBaixaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new DarBaixaContaReceberCommand(id, clienteId, body.DataPagamento, body.FormaPagamento), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelarContaReceberCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

public record CreateContaReceberRequest(Guid DestinatarioId, Guid? PedidoId, string Descricao, decimal ValorTotal, DateTime DataVencimento, string? Observacao);
public record UpdateContaReceberRequest(Guid DestinatarioId, Guid? PedidoId, string Descricao, decimal ValorTotal, DateTime DataVencimento, string? Observacao);
public record DarBaixaRequest(DateTime? DataPagamento, string? FormaPagamento);
