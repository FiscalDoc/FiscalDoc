using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.DeleteDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.UpdateDestinatario;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/destinatarios")]
[Authorize]
public sealed class DestinatariosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDestinatariosQuery(clienteId, termo, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreateDestinatarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateDestinatarioCommand(
            clienteId, body.RazaoSocial, body.NomeFantasia, body.CpfCnpj,
            body.InscricaoEstadual, body.Email, body.Telefone,
            body.Logradouro, body.Numero, body.Complemento,
            body.Bairro, body.Cidade, body.Estado, body.Cep, body.CodigoIbgeCidade), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateDestinatarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateDestinatarioCommand(
            id, body.RazaoSocial, body.NomeFantasia, body.CpfCnpj,
            body.InscricaoEstadual, body.Email, body.Telefone,
            body.Logradouro, body.Numero, body.Complemento,
            body.Bairro, body.Cidade, body.Estado, body.Cep,
            body.CodigoIbgeCidade, body.Ativo), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteDestinatarioCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }
}

public record CreateDestinatarioRequest(
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

public record UpdateDestinatarioRequest(
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
