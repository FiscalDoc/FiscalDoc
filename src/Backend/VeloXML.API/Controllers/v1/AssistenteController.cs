using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Assistente.Commands.EnviarMensagem;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/assistente")]
[Authorize]
public sealed class AssistenteController(IMediator mediator) : ControllerBase
{
    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new EnviarMensagemAssistenteCommand(body.Mensagens, body.ClienteId, body.PedidoId), ct);
        return result.IsSuccess ? Ok(new { resposta = result.Value }) : BadRequest(result.Error);
    }
}

public record ChatRequest(List<ChatMensagemInput> Mensagens, Guid? ClienteId, Guid? PedidoId);
