using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Usuarios.Commands.CreateUsuario;
using VeloXML.Application.Features.Usuarios.Commands.DeleteUsuario;
using VeloXML.Application.Features.Usuarios.Commands.UpdateUsuario;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarioById;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/usuarios")]
[Authorize(Roles = "Administrador")]
public sealed class UsuariosController(IMediator mediator, IStorageService storage) : ControllerBase
{
    // Anônimo de propósito (mesmo padrão de ContadoresController.GetFoto) — é só uma imagem de
    // perfil de baixa sensibilidade, e assim qualquer tela logada (inclusive a sidebar) consegue
    // montar o <img src> direto, sem se preocupar com o Authorize da classe (Administrador).
    [HttpGet("{id:guid}/avatar")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvatar(Guid id, CancellationToken ct)
    {
        var objectKey = $"usuarios/{id}/avatar";
        try
        {
            var stream = await storage.DownloadAsync(objectKey, storage.ResolveBucket("veloxml"), ct);
            return File(stream, "image/jpeg");
        }
        catch
        {
            return NotFound();
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? termo,
        [FromQuery] string? perfil,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetUsuariosQuery(termo, perfil, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetUsuarioByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUsuarioCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUsuarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateUsuarioCommand(id, body.Nome, body.Ativo, body.NovaSenha), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteUsuarioCommand(id), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}

public record UpdateUsuarioRequest(string Nome, bool Ativo, string? NovaSenha);
