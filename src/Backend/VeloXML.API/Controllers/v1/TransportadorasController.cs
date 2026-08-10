using ClosedXML.Excel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.DeleteTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.UpdateTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.BulkAtivarTransportadora;
using VeloXML.Application.Features.Transportadoras.Commands.DuplicarTransportadora;
using VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraById;
using VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraVizinhos;
using VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoras;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/transportadoras")]
[Authorize]
public sealed class TransportadorasController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetTransportadorasQuery(clienteId, termo, ativo, page, pageSize), ct);
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
            body.Bairro, body.Cidade, body.Estado, body.Cep, body.CodigoIbgeCidade,
            body.WebhookAtivo, body.WebhookUrl), ct);
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
            body.CodigoIbgeCidade, body.Ativo, body.WebhookAtivo, body.WebhookUrl), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteTransportadoraCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}/vizinhos")]
    public async Task<IActionResult> GetVizinhos(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTransportadoraVizinhosQuery(clienteId, id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/duplicar")]
    public async Task<IActionResult> Duplicar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DuplicarTransportadoraCommand(id, clienteId), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : NotFound(result.Error);
    }

    [HttpPatch("ativo-lote")]
    public async Task<IActionResult> BulkAtivar(Guid clienteId, [FromBody] BulkAtivoTransportadoraRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new BulkAtivarTransportadoraCommand(clienteId, body.Ids, body.Ativo), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    private static readonly string[] TransportadoraColunas =
        ["RazaoSocial", "NomeFantasia", "CpfCnpj", "InscricaoEstadual", "Email", "Telefone", "Logradouro", "Numero", "Complemento", "Bairro", "Cidade", "Estado", "Cep"];

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, CancellationToken ct)
    {
        var result = await mediator.Send(new GetTransportadorasQuery(clienteId, termo, ativo, 1, int.MaxValue), ct);
        if (!result.IsSuccess) return BadRequest(result.Error);

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Transportadoras");
        for (var i = 0; i < TransportadoraColunas.Length; i++) ws.Cell(1, i + 1).Value = TransportadoraColunas[i];

        var linha = 2;
        foreach (var t in result.Value!.Items)
        {
            ws.Cell(linha, 1).Value = t.RazaoSocial;
            ws.Cell(linha, 2).Value = t.NomeFantasia ?? "";
            ws.Cell(linha, 3).Value = t.CpfCnpj ?? "";
            ws.Cell(linha, 4).Value = t.InscricaoEstadual ?? "";
            ws.Cell(linha, 5).Value = t.Email ?? "";
            ws.Cell(linha, 6).Value = t.Telefone ?? "";
            ws.Cell(linha, 7).Value = t.Logradouro ?? "";
            ws.Cell(linha, 8).Value = t.Numero ?? "";
            ws.Cell(linha, 9).Value = t.Complemento ?? "";
            ws.Cell(linha, 10).Value = t.Bairro ?? "";
            ws.Cell(linha, 11).Value = t.Cidade ?? "";
            ws.Cell(linha, 12).Value = t.Estado ?? "";
            ws.Cell(linha, 13).Value = t.Cep ?? "";
            linha++;
        }
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "transportadoras.xlsx");
    }

    [HttpPost("importar")]
    public async Task<IActionResult> Importar(Guid clienteId, IFormFile arquivo, CancellationToken ct)
    {
        if (arquivo is null || arquivo.Length == 0)
            return BadRequest(new { message = "Nenhum arquivo enviado." });

        using var stream = arquivo.OpenReadStream();
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();

        var criados = 0;
        var erros = new List<string>();
        foreach (var linha in ws.RowsUsed().Skip(1))
        {
            var razaoSocial = linha.Cell(1).GetString().Trim();
            if (string.IsNullOrWhiteSpace(razaoSocial))
            {
                erros.Add($"Linha {linha.RowNumber()}: razão social é obrigatória.");
                continue;
            }

            string? Texto(int col) { var v = linha.Cell(col).GetString().Trim(); return string.IsNullOrWhiteSpace(v) ? null : v; }

            var result = await mediator.Send(new CreateTransportadoraCommand(
                clienteId, razaoSocial, Texto(2), Texto(3), Texto(4), Texto(5), Texto(6),
                Texto(7), Texto(8), Texto(9), Texto(10), Texto(11), Texto(12), Texto(13), null), ct);

            if (result.IsSuccess) criados++;
            else erros.Add($"Linha {linha.RowNumber()}: {result.Error?.Description}");
        }

        return Ok(new { criados, erros });
    }
}

public record BulkAtivoTransportadoraRequest(List<Guid> Ids, bool Ativo);

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
    string? CodigoIbgeCidade,
    bool WebhookAtivo = false,
    string? WebhookUrl = null
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
    bool Ativo,
    bool WebhookAtivo = false,
    string? WebhookUrl = null
);
