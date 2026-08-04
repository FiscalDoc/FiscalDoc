using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common;
using VeloXML.Application.Features.Pedidos.Commands.ProcessarWebhookFocusNfe;
using VeloXML.Domain.Interfaces;

namespace VeloXML.API.Controllers.v1;

// URL registrada manualmente no painel da Focus NFe, com um secret único da instalação
// embutido no path (eles não assinam o corpo do webhook) — sem isso, qualquer um que
// descobrisse a rota poderia forjar "NF-e autorizada" pra qualquer ref.
[ApiController]
[Route("api/v1/webhooks/focus-nfe")]
[AllowAnonymous]
public sealed class FocusNfeWebhookController(IMediator mediator, IUnitOfWork uow) : ControllerBase
{
    [HttpPost("{secretToken}")]
    public async Task<IActionResult> Receber(string secretToken, CancellationToken ct)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(FocusNfeConfigKeys.WebhookSecret, ct);
        var esperado = config?.Valor;
        if (string.IsNullOrEmpty(esperado) || !SecretConfere(secretToken, esperado))
            return NotFound();

        string? refId;
        try
        {
            using var doc = await JsonDocument.ParseAsync(Request.Body, cancellationToken: ct);
            refId = doc.RootElement.TryGetProperty("ref", out var refEl) ? refEl.GetString() : null;
        }
        catch (JsonException)
        {
            refId = null;
        }

        // Corpo inesperado — responde 200 mesmo assim pra não entrar no retry schedule da
        // Focus por um payload que nunca vai ficar "certo".
        if (string.IsNullOrEmpty(refId))
            return Ok();

        var result = await mediator.Send(new ProcessarWebhookFocusNfeCommand(refId), ct);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    private static bool SecretConfere(string recebido, string esperado) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(recebido), Encoding.UTF8.GetBytes(esperado));
}
