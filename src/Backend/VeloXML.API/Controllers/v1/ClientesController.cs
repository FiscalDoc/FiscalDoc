using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Clientes.Commands.CreateCliente;
using VeloXML.Application.Features.Clientes.Commands.DeleteCliente;
using VeloXML.Application.Features.Clientes.Commands.UpdateCliente;
using VeloXML.Application.Features.Clientes.Commands.ConfigurarImap;
using VeloXML.Application.Features.Clientes.Commands.ConfigurarWebhook;
using VeloXML.Application.Features.Clientes.Commands.CriarContaCliente;
using VeloXML.Application.Features.Clientes.Commands.RegenerarAppKey;
using VeloXML.Application.Features.Clientes.Queries.GetClienteById;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Application.Features.Clientes.Commands.UpdateClienteFiscal;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes")]
[Authorize]
public sealed class ClientesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? termo, [FromQuery] Guid? contadorId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetClientesQuery(termo, contadorId, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetClienteByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClienteCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? CreatedAtAction(nameof(GetById), new { id = result.Value.Id }, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClienteCommand command, CancellationToken ct)
    {
        if (id != command.Id) return BadRequest(new { message = "Id da rota difere do body." });
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteClienteCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/regenerar-appkey")]
    public async Task<IActionResult> RegenerarAppKey(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new RegenerarAppKeyCommand(id), ct);
        return result.IsSuccess ? Ok(new { appKey = result.Value }) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/criar-conta")]
    public async Task<IActionResult> CriarContaCliente(Guid id, [FromBody] CriarContaClienteRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CriarContaClienteCommand(id, body.Nome, body.Email, body.Senha), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}/webhook")]
    public async Task<IActionResult> ConfigurarWebhook(Guid id, [FromBody] ConfigurarWebhookRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new ConfigurarWebhookCommand(id, body.Habilitado, body.Url), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPut("{id:guid}/imap")]
    public async Task<IActionResult> ConfigurarImap(Guid id, [FromBody] ConfigurarImapRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new ConfigurarImapCommand(
            id, body.Habilitado, body.Host, body.Port, body.Email, body.Senha), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPut("{id:guid}/fiscal")]
    public async Task<IActionResult> UpdateFiscal(Guid id, [FromBody] UpdateClienteFiscalRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateClienteFiscalCommand(
            id, body.RegimeTributario, body.InscricaoEstadual, body.InscricaoMunicipal,
            body.CnaePrincipal, body.SerieNfe ?? "1", body.NfeHabilitado), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }
}

public record ConfigurarWebhookRequest(bool Habilitado, string? Url);
public record ConfigurarImapRequest(bool Habilitado, string? Host, int Port = 993, string? Email = null, string? Senha = null);
public record CriarContaClienteRequest(string Nome, string Email, string Senha);
public record UpdateClienteFiscalRequest(
    string? RegimeTributario,
    string? InscricaoEstadual,
    string? InscricaoMunicipal,
    string? CnaePrincipal,
    string? SerieNfe,
    bool NfeHabilitado
);
