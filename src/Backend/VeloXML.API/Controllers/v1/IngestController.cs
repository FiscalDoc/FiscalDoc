using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Domain.Enums;
using VeloXML.Infrastructure.Auth;

namespace VeloXML.API.Controllers.v1;

// Endpoint de integração pra sistemas externos (ERP, emissor de NF-e) enviarem o XML
// direto no corpo da requisição, autenticando só com a AppKey do cliente — sem precisar
// de login de usuário/JWT nem montar multipart/form-data.
[ApiController]
[Route("api/v1/ingest")]
[Authorize(AuthenticationSchemes = AppKeyAuthenticationOptions.SchemeName)]
public sealed class IngestController(IMediator mediator) : ControllerBase
{
    [HttpPost("xml")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Xml([FromQuery] TipoDocumentoEnum tipo, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await Request.Body.CopyToAsync(ms, ct);
        if (ms.Length == 0)
            return BadRequest(new { code = "EMPTY_BODY", message = "Corpo da requisição vazio — envie o XML no body." });
        ms.Position = 0;

        var fileName = Request.Headers.TryGetValue("X-File-Name", out var fn) && !string.IsNullOrWhiteSpace(fn)
            ? fn.ToString()
            : $"{tipo}_{Guid.NewGuid():N}.xml";

        var dto = new FileUploadDto(ms, fileName, "application/xml", ms.Length);

        // ClienteId vem só da AppKey (claim cliente_id) — o handler ignora qualquer
        // tentativa de mirar outro cliente quando o chamador já está escopado a um.
        var result = await mediator.Send(new UploadDocumentoCommand(null, tipo, dto), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
