using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Usuarios.Commands.CreateClienteUsuario;
using VeloXML.Application.Features.Usuarios.Commands.DeleteClienteUsuario;
using VeloXML.Application.Features.Usuarios.Commands.UpdateClienteUsuario;
using VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarioById;
using VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarios;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/usuarios")]
[Authorize(Roles = "Administrador,Contador,UsuarioContador,Cliente")]
public sealed class ClienteUsuariosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetClienteUsuariosQuery(clienteId, termo, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetClienteUsuarioByIdQuery(clienteId, id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreateClienteUsuarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateClienteUsuarioCommand(clienteId, body.Nome, body.Email), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateClienteUsuarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateClienteUsuarioCommand(clienteId, id, body.Nome, body.Ativo, body.NovaSenha), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteClienteUsuarioCommand(clienteId, id), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

public record CreateClienteUsuarioRequest(string Nome, string Email);
public record UpdateClienteUsuarioRequest(string Nome, bool Ativo, string? NovaSenha);
