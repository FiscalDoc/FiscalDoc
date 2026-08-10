using ClosedXML.Excel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.DeleteDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.UpdateDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.BulkAtivarDestinatario;
using VeloXML.Application.Features.Destinatarios.Commands.DuplicarDestinatario;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioById;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioVizinhos;
using VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/destinatarios")]
[Authorize]
public sealed class DestinatariosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetDestinatariosQuery(clienteId, termo, ativo, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetDestinatarioByIdQuery(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
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
            id, clienteId, body.RazaoSocial, body.NomeFantasia, body.CpfCnpj,
            body.InscricaoEstadual, body.Email, body.Telefone,
            body.Logradouro, body.Numero, body.Complemento,
            body.Bairro, body.Cidade, body.Estado, body.Cep,
            body.CodigoIbgeCidade, body.Ativo), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteDestinatarioCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }

    [HttpGet("{id:guid}/vizinhos")]
    public async Task<IActionResult> GetVizinhos(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetDestinatarioVizinhosQuery(clienteId, id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/duplicar")]
    public async Task<IActionResult> Duplicar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DuplicarDestinatarioCommand(id, clienteId), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : NotFound(result.Error);
    }

    [HttpPatch("ativo-lote")]
    public async Task<IActionResult> BulkAtivar(Guid clienteId, [FromBody] BulkAtivoDestinatarioRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new BulkAtivarDestinatarioCommand(clienteId, body.Ids, body.Ativo), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    private static readonly string[] DestinatarioColunas =
        ["RazaoSocial", "NomeFantasia", "CpfCnpj", "InscricaoEstadual", "Email", "Telefone", "Logradouro", "Numero", "Complemento", "Bairro", "Cidade", "Estado", "Cep"];

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, CancellationToken ct)
    {
        var result = await mediator.Send(new GetDestinatariosQuery(clienteId, termo, ativo, 1, int.MaxValue), ct);
        if (!result.IsSuccess) return BadRequest(result.Error);

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Destinatarios");
        for (var i = 0; i < DestinatarioColunas.Length; i++) ws.Cell(1, i + 1).Value = DestinatarioColunas[i];

        var linha = 2;
        foreach (var d in result.Value!.Items)
        {
            ws.Cell(linha, 1).Value = d.RazaoSocial;
            ws.Cell(linha, 2).Value = d.NomeFantasia ?? "";
            ws.Cell(linha, 3).Value = d.CpfCnpj ?? "";
            ws.Cell(linha, 4).Value = d.InscricaoEstadual ?? "";
            ws.Cell(linha, 5).Value = d.Email ?? "";
            ws.Cell(linha, 6).Value = d.Telefone ?? "";
            ws.Cell(linha, 7).Value = d.Logradouro ?? "";
            ws.Cell(linha, 8).Value = d.Numero ?? "";
            ws.Cell(linha, 9).Value = d.Complemento ?? "";
            ws.Cell(linha, 10).Value = d.Bairro ?? "";
            ws.Cell(linha, 11).Value = d.Cidade ?? "";
            ws.Cell(linha, 12).Value = d.Estado ?? "";
            ws.Cell(linha, 13).Value = d.Cep ?? "";
            linha++;
        }
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "destinatarios.xlsx");
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

            var result = await mediator.Send(new CreateDestinatarioCommand(
                clienteId, razaoSocial, Texto(2), Texto(3), Texto(4), Texto(5), Texto(6),
                Texto(7), Texto(8), Texto(9), Texto(10), Texto(11), Texto(12), Texto(13), null), ct);

            if (result.IsSuccess) criados++;
            else erros.Add($"Linha {linha.RowNumber()}: {result.Error?.Description}");
        }

        return Ok(new { criados, erros });
    }
}

public record BulkAtivoDestinatarioRequest(List<Guid> Ids, bool Ativo);

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
