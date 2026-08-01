using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Contadores.Commands.AtualizarPlanoContador;
using VeloXML.Application.Features.Contadores.Commands.BloquearContador;
using VeloXML.Application.Features.Contadores.Commands.CreateContador;
using VeloXML.Application.Features.Contadores.Commands.GerarCobrancaMensal;
using VeloXML.Application.Features.Contadores.Commands.LiberarContador;
using VeloXML.Application.Features.Contadores.Commands.MarcarCobrancaPaga;
using VeloXML.Application.Features.Contadores.Commands.ReabrirCobranca;
using VeloXML.Application.Features.Contadores.Commands.ResendBoasVindas;
using VeloXML.Application.Features.Contadores.Commands.UpdateContador;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Contadores.Commands.ResetSenhaContador;
using VeloXML.Application.Features.Contadores.Commands.SetDataLimiteAcesso;
using VeloXML.Application.Features.Contadores.Queries.GetContadorById;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Application.Features.Contadores.Queries.GetHistoricoCobrancas;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/contadores")]
[Authorize]
public sealed class ContadoresController(IMediator mediator, IStorageService storage) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GetAll([FromQuery] string? termo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetContadoresQuery(termo, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetContadorByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Create([FromBody] CreateContadorCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value.Contador.Id }, result.Value)
            : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContadorRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateContadorCommand(
            id, body.Nome, body.Telefone, body.Crc, body.Empresa,
            body.CanalNotificacao, body.NotifNovasNotas, body.NotifAlertas,
            body.NotifResumoSemanal, body.NotifConsolidadoMensal), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/foto")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> UploadFoto(Guid id, IFormFile foto, CancellationToken ct)
    {
        if (foto is null || foto.Length == 0)
            return BadRequest("Arquivo inválido.");

        var allowed = new[] { "image/jpeg", "image/png", "image/webp" };
        if (!allowed.Contains(foto.ContentType))
            return BadRequest("Formato não suportado. Use JPG, PNG ou WebP.");

        var objectKey = $"contadores/{id}/foto";
        await using var stream = foto.OpenReadStream();
        await storage.UploadAsync(stream, objectKey, storage.ResolveBucket("veloxml"), foto.ContentType, ct);

        // Store the foto path in DB via direct update
        using var scope = HttpContext.RequestServices.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<VeloXML.Domain.Interfaces.IUnitOfWork>();
        var contador = await uow.Contadores.GetByIdAsync(id, ct);
        if (contador is null) return NotFound();
        contador.FotoUrl = objectKey;
        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);

        return Ok(new { fotoUrl = objectKey });
    }

    [HttpGet("{id:guid}/foto")]
    [AllowAnonymous]
    public async Task<IActionResult> GetFoto(Guid id, CancellationToken ct)
    {
        var objectKey = $"contadores/{id}/foto";
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

    [HttpPost("{id:guid}/bloquear")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Bloquear(Guid id, [FromBody] BloquearContadorRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new BloquearContadorCommand(id, body.Motivo), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/liberar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Liberar(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new LiberarContadorCommand(id), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}/plano")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> AtualizarPlano(Guid id, [FromBody] AtualizarPlanoContadorCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command with { ContadorId = id }, ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/cobrancas")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GerarCobranca(Guid id, [FromBody] GerarCobrancaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new GerarCobrancaMensalCommand(id, body.Mes, body.Ano, body.DiasVencimento), ct);
        return result.IsSuccess ? Created($"/api/v1/contadores/{id}/cobrancas", result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}/cobrancas")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> GetHistorico(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetHistoricoCobrancasQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("cobrancas/{cobrancaId:guid}/pagar")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> MarcarPaga(Guid cobrancaId, [FromBody] MarcarPagaRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new MarcarCobrancaPagaCommand(cobrancaId, body.Observacao), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("cobrancas/{cobrancaId:guid}/reabrir")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ReabrirCobranca(Guid cobrancaId, CancellationToken ct)
    {
        var result = await mediator.Send(new ReabrirCobrancaCommand(cobrancaId), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/reset-senha")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ResetSenha(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new ResetSenhaContadorCommand(id), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPost("{id:guid}/reenviar-boas-vindas")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ResendBoasVindas(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new ResendBoasVindasCommand(id), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}/data-limite-acesso")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> SetDataLimiteAcesso(Guid id, [FromBody] SetDataLimiteRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new SetDataLimiteAcessoCommand(id, body.DataLimite), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }
}

public record UpdateContadorRequest(
    string Nome, string? Telefone, string? Crc, string? Empresa,
    string CanalNotificacao = "ambos",
    bool NotifNovasNotas = true, bool NotifAlertas = true,
    bool NotifResumoSemanal = false, bool NotifConsolidadoMensal = false);
public record BloquearContadorRequest(string? Motivo);
public record GerarCobrancaRequest(int Mes, int Ano, int DiasVencimento = 10);
public record MarcarPagaRequest(string? Observacao);
public record SetDataLimiteRequest(DateTime? DataLimite);
