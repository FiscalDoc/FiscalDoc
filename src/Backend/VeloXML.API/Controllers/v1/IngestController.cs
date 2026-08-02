using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Infrastructure.Auth;
using VeloXML.SharedKernel;

namespace VeloXML.API.Controllers.v1;

// Endpoint de integração pra sistemas externos (ERP, emissor de NF-e) enviarem o XML
// direto no corpo da requisição, autenticando só com a AppKey do cliente — sem precisar
// de login de usuário/JWT nem montar multipart/form-data.
[ApiController]
[Route("api/v1/ingest")]
[Authorize(AuthenticationSchemes = AppKeyAuthenticationOptions.SchemeName)]
public sealed class IngestController(IMediator mediator, IUnitOfWork uow, ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("xml")]
    [RequestSizeLimit(52_428_800)]
    public async Task<IActionResult> Xml([FromQuery] TipoDocumentoEnum tipo, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(currentUser.ClienteId!.Value, ct);
        if (cliente is null)
            return Unauthorized();

        using var ms = new MemoryStream();
        await Request.Body.CopyToAsync(ms, ct);
        if (ms.Length == 0)
        {
            await RegistrarLogAsync(cliente, xmlsProcessados: 0, xmlsImportados: 0,
                erro: "Corpo da requisição vazio — envie o XML no body.", documentoIds: [], ct);
            return BadRequest(new { code = "EMPTY_BODY", message = "Corpo da requisição vazio — envie o XML no body." });
        }
        ms.Position = 0;

        var fileName = Request.Headers.TryGetValue("X-File-Name", out var fn) && !string.IsNullOrWhiteSpace(fn)
            ? fn.ToString()
            : $"{tipo}_{Guid.NewGuid():N}.xml";

        var dto = new FileUploadDto(ms, fileName, "application/xml", ms.Length);

        // ClienteId vem só da AppKey (claim cliente_id) — o handler ignora qualquer
        // tentativa de mirar outro cliente quando o chamador já está escopado a um.
        var result = await mediator.Send(new UploadDocumentoCommand(null, tipo, dto, OrigemImportacaoEnum.ApiIngest), ct);

        await RegistrarLogAsync(cliente, xmlsProcessados: 1, xmlsImportados: result.IsSuccess ? 1 : 0,
            erro: result.IsSuccess ? null : result.Error.Description,
            documentoIds: result.IsSuccess ? [result.Value.Id] : [], ct);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    private async Task RegistrarLogAsync(
        Cliente cliente, int xmlsProcessados, int xmlsImportados, string? erro, List<Guid> documentoIds, CancellationToken ct)
    {
        await uow.ImportacaoXmlLogs.AddAsync(new ImportacaoXmlLog
        {
            TenantId          = cliente.TenantId,
            ContadorId        = cliente.ContadorId,
            Origem            = OrigemImportacaoEnum.ApiIngest,
            ExecutadoEm       = DateTime.UtcNow,
            ClienteId         = cliente.Id,
            ClienteNome       = cliente.RazaoSocial,
            EmailsEncontrados = 0,
            XmlsProcessados   = xmlsProcessados,
            XmlsImportados    = xmlsImportados,
            Erros             = erro is not null ? 1 : 0,
            MensagemErro      = erro,
            DocumentoIds      = documentoIds,
        }, ct);
        await uow.SaveChangesAsync(ct);
    }
}
