using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Pedidos.Commands.CancelarPedido;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Application.Features.Pedidos.Commands.DeletePedido;
using VeloXML.Application.Features.Pedidos.Commands.DuplicarPedido;
using VeloXML.Application.Features.Pedidos.Commands.EmitirPedido;
using VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;
using VeloXML.Application.Features.Pedidos.Commands.VincularDocumento;
using VeloXML.Application.Features.Pedidos.Queries.GetPedidoById;
using VeloXML.Application.Features.Pedidos.Queries.GetPedidoVizinhos;
using VeloXML.Application.Features.Pedidos.Queries.GetPedidos;
using VeloXML.Application.Features.Pedidos.Queries.GetProdutosFrequentes;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/pedidos")]
[Authorize]
public sealed class PedidosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        Guid clienteId, [FromQuery] string? status, [FromQuery] string? termo,
        [FromQuery] DateTime? de, [FromQuery] DateTime? ate,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetPedidosQuery(clienteId, status, termo, de, ate, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPedidoByIdQuery(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpGet("produtos-frequentes")]
    public async Task<IActionResult> GetProdutosFrequentes(Guid clienteId, [FromQuery] Guid destinatarioId, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProdutosFrequentesQuery(clienteId, destinatarioId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}/vizinhos")]
    public async Task<IActionResult> GetVizinhos(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetPedidoVizinhosQuery(clienteId, id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreatePedidoCommand command, CancellationToken ct)
    {
        var cmd = command with { ClienteId = clienteId };
        var result = await mediator.Send(cmd, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { clienteId, id = result.Value.Id }, result.Value)
            : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdatePedidoCommand command, CancellationToken ct)
    {
        var cmd = command with { Id = id, ClienteId = clienteId };
        var result = await mediator.Send(cmd, ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/cancelar")]
    public async Task<IActionResult> Cancelar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new CancelarPedidoCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/emitir")]
    public async Task<IActionResult> Emitir(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new EmitirPedidoCommand(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/duplicar")]
    public async Task<IActionResult> Duplicar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DuplicarPedidoCommand(id, clienteId), ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { clienteId, id = result.Value.Id }, result.Value)
            : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeletePedidoCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/vincular-documento")]
    public async Task<IActionResult> VincularDocumento(Guid clienteId, Guid id, [FromBody] VincularDocumentoRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new VincularDocumentoCommand(id, clienteId, body.DocumentoId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/desvincular-documento")]
    public async Task<IActionResult> DesvincularDocumento(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DesvincularDocumentoCommand(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}

public record VincularDocumentoRequest(Guid DocumentoId);
