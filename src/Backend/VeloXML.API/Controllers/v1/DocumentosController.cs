using System.IO.Compression;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Documentos.Commands.DeleteDocumento;
using VeloXML.Application.Features.Documentos.Commands.DeleteDocumentosLote;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentoById;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Infrastructure.Auth;
using VeloXML.Infrastructure.Storage;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/documentos")]
[Authorize]
public sealed class DocumentosController(
    IMediator mediator,
    IUnitOfWork uow,
    IStorageService storage,
    DocumentoDownloadTokenService downloadTokens) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? termo,
        [FromQuery] Guid? clienteId,
        [FromQuery] TipoDocumentoEnum? tipo,
        [FromQuery] StatusDocumentoEnum? status,
        [FromQuery] OrigemImportacaoEnum? origem,
        [FromQuery] DateTime? de,
        [FromQuery] DateTime? ate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDocumentosQuery(termo, clienteId, tipo, status, origem, de, ate, page, pageSize), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetDocumentoByIdQuery(id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpGet("{id:guid}/arquivo")]
    public async Task<IActionResult> DownloadArquivo(Guid id, CancellationToken ct)
    {
        var doc = await uow.Documentos.GetByIdWithArquivosAsync(id, ct);
        if (doc is null) return NotFound();
        return await ServirArquivoAsync(doc, ct);
    }

    // Gera um link de download de curta duração (2 min), assinado, sem exigir o header
    // Authorization — permite que o front navegue direto pro link (em vez de baixar bytes via
    // JS e montar um blob: URL), o que evita o aviso do Chrome "isso pode danificar seu
    // dispositivo" (esse aviso é específico de downloads disparados via blob:, não de uma
    // navegação normal pra uma URL).
    [HttpGet("{id:guid}/link-download")]
    public async Task<IActionResult> GetLinkDownload(Guid id, CancellationToken ct)
    {
        var existe = await uow.Documentos.ExistsAsync(d => d.Id == id, ct);
        if (!existe) return NotFound();

        var token = downloadTokens.Gerar(id, TimeSpan.FromMinutes(2));
        var url = Url.Action(nameof(DownloadPorToken), null, new { token }, Request.Scheme);
        return Ok(new { url });
    }

    [HttpGet("download")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadPorToken([FromQuery] string token, CancellationToken ct)
    {
        var id = downloadTokens.Validar(token);
        if (id is null) return Unauthorized();

        var doc = await uow.Documentos.GetByIdWithArquivosAsync(id.Value, ct);
        if (doc is null) return NotFound();
        return await ServirArquivoAsync(doc, ct);
    }

    private async Task<IActionResult> ServirArquivoAsync(VeloXML.Domain.Entities.Documento doc, CancellationToken ct)
    {
        var arquivo = doc.Arquivos.FirstOrDefault();
        if (arquivo is null)
        {
            // Gera XML sintético quando não há arquivo armazenado (modo demo / seed)
            var xml = GerarXmlSintetico(doc);
            var bytes = System.Text.Encoding.UTF8.GetBytes(xml);
            return File(bytes, "application/xml", $"{MontarNomeArquivo(doc)}.xml");
        }

        var stream = await storage.DownloadAsync(arquivo.ObjectKey, arquivo.Bucket, ct);
        return File(stream, arquivo.MimeType ?? "application/octet-stream", arquivo.NomeOriginal);
    }

    private static string MontarNomeArquivo(VeloXML.Domain.Entities.Documento doc)
        => doc.ChaveAcesso ?? doc.Numero ?? doc.Id.ToString();

    private static string GerarXmlSintetico(VeloXML.Domain.Entities.Documento doc)
    {
        var chave = doc.ChaveAcesso ?? doc.Id.ToString("N").PadRight(44, '0')[..44];
        var emitente = System.Security.SecurityElement.Escape(doc.NomeEmitente ?? "Emitente");
        var destinatario = System.Security.SecurityElement.Escape(doc.NomeDestinatario ?? "Destinatário");
        var tipo = doc.Tipo.ToString();

        return $"""
<?xml version="1.0" encoding="UTF-8"?>
<!-- FiscalDoc - Documento Fiscal Eletrônico -->
<!-- Tipo: {tipo} | Número: {doc.Numero} -->
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe{chave}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <nNF>{doc.Numero}</nNF>
        <dhEmi>{doc.DataEmissao:yyyy-MM-ddTHH:mm:ss-03:00}</dhEmi>
        <tpNF>1</tpNF>
        <mod>55</mod>
      </ide>
      <emit>
        <CNPJ>{doc.CnpjEmitente}</CNPJ>
        <xNome>{emitente}</xNome>
      </emit>
      <dest>
        <CNPJ>{doc.CnpjDestinatario}</CNPJ>
        <xNome>{destinatario}</xNome>
      </dest>
      <total>
        <ICMSTot>
          <vNF>{doc.ValorTotal:F2}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>
""";
    }

    [HttpGet("lote")]
    public async Task<IActionResult> DownloadLote(
        [FromQuery] Guid clienteId,
        [FromQuery] int mes,
        [FromQuery] int ano,
        CancellationToken ct)
    {
        var docs = await uow.Documentos.GetByClienteMesAsync(clienteId, mes, ano, ct);
        if (docs.Count == 0)
            return NotFound(new { message = "Nenhum documento encontrado para o período selecionado." });

        var ms = new MemoryStream();
        using (var zip = new ZipArchive(ms, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var doc in docs)
            {
                if (doc.Arquivos.Count == 0)
                {
                    var xmlContent = GerarXmlSintetico(doc);
                    var bytes = System.Text.Encoding.UTF8.GetBytes(xmlContent);
                    var syntheticEntry = zip.CreateEntry($"{MontarNomeArquivo(doc)}.xml", CompressionLevel.Fastest);
                    await using var syntheticStream = syntheticEntry.Open();
                    await syntheticStream.WriteAsync(bytes, ct);
                    continue;
                }
                foreach (var arquivo in doc.Arquivos)
                {
                    var entryName = $"{MontarNomeArquivo(doc)}_{arquivo.NomeOriginal}";
                    var entry = zip.CreateEntry(entryName, CompressionLevel.Fastest);
                    await using var entryStream = entry.Open();
                    var fileStream = await storage.DownloadAsync(arquivo.ObjectKey, arquivo.Bucket, ct);
                    await fileStream.CopyToAsync(entryStream, ct);
                }
            }
        }
        ms.Position = 0;

        var nomeCliente = docs[0].Cliente?.RazaoSocial ?? clienteId.ToString();
        var nomeSanitizado = string.Concat(nomeCliente.Where(c => !Path.GetInvalidFileNameChars().Contains(c)));
        return File(ms, "application/zip", $"{nomeSanitizado}_{mes:D2}_{ano}.zip");
    }

    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    [Authorize(AuthenticationSchemes = $"{JwtBearerDefaults.AuthenticationScheme},{AppKeyAuthenticationOptions.SchemeName}")]
    public async Task<IActionResult> Upload(
        [FromForm] Guid? clienteId,
        [FromForm] TipoDocumentoEnum tipo,
        IFormFile file,
        CancellationToken ct)
    {
        if (file.Length == 0) return BadRequest(new { message = "Arquivo vazio." });

        var dto = new FileUploadDto(file.OpenReadStream(), file.FileName, file.ContentType, file.Length);
        var result = await mediator.Send(new UploadDocumentoCommand(clienteId, tipo, dto, OrigemImportacaoEnum.Manual), ct);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteDocumentoCommand(id), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }

    [HttpPost("excluir-lote")]
    public async Task<IActionResult> DeleteLote([FromBody] ExcluirLoteRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteDocumentosLoteCommand(body.Ids), ct);
        return result.IsSuccess ? Ok(new { excluidos = result.Value }) : BadRequest(result.Error);
    }
}

public record ExcluirLoteRequest(List<Guid> Ids);
