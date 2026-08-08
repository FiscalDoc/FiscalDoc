using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.DeleteTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.UpdateTransportadora;
using VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraById;
using VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoras;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/transportadoras")]
[Authorize]
public sealed class TransportadorasController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetTransportadorasQuery(clienteId, termo, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTransportadoraByIdQuery(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreateTransportadoraRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateTransportadoraCommand(
            clienteId, body.RazaoSocial, body.NomeFantasia, body.CpfCnpj,
            body.InscricaoEstadual, body.Email, body.Telefone,
            body.Logradouro, body.Numero, body.Complemento,
            body.Bairro, body.Cidade, body.Estado, body.Cep, body.CodigoIbgeCidade), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateTransportadoraRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateTransportadoraCommand(
            id, clienteId, body.RazaoSocial, body.NomeFantasia, body.CpfCnpj,
            body.InscricaoEstadual, body.Email, body.Telefone,
            body.Logradouro, body.Numero, body.Complemento,
            body.Bairro, body.Cidade, body.Estado, body.Cep,
            body.CodigoIbgeCidade, body.Ativo), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteTransportadoraCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

public record CreateTransportadoraRequest(
    string RazaoSocial,
    string? NomeFantasia,
    string? CpfCnpj,
    string? InscricaoEstadual,
    string? Email,
    string? Telefone,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? Cep,
    string? CodigoIbgeCidade
);

public record UpdateTransportadoraRequest(
    string RazaoSocial,
    string? NomeFantasia,
    string? CpfCnpj,
    string? InscricaoEstadual,
    string? Email,
    string? Telefone,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? Cep,
    string? CodigoIbgeCidade,
    bool Ativo
);
