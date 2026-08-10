using ClosedXML.Excel;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Application.Features.Produtos.Commands.DeleteProduto;
using VeloXML.Application.Features.Produtos.Commands.UpdateProduto;
using VeloXML.Application.Features.Produtos.Commands.BulkAtivarProduto;
using VeloXML.Application.Features.Produtos.Commands.DuplicarProduto;
using VeloXML.Application.Features.Produtos.Queries.GetProdutoById;
using VeloXML.Application.Features.Produtos.Queries.GetProdutoVizinhos;
using VeloXML.Application.Features.Produtos.Queries.GetProdutos;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/produtos")]
[Authorize]
public sealed class ProdutosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProdutosQuery(clienteId, termo, ativo, page, pageSize), ct);
        return Ok(result.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProdutoByIdQuery(id, clienteId), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clienteId, [FromBody] CreateProdutoRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new CreateProdutoCommand(
            clienteId, body.Codigo, body.Descricao, body.Ncm,
            body.Unidade, body.PrecoUnitario, body.Cfop,
            body.AliquotaIcms, body.AliquotaPis, body.AliquotaCofins,
            body.CstIcms, body.CstPis, body.CstCofins, body.IcmsOrigem, body.IbsCbsCst, body.IbsCbsClassificacaoTributaria,
            body.ValorCusto, body.PercentualImposto, body.CstIpi, body.AliquotaIpi), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateProdutoRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProdutoCommand(
            id, clienteId, body.Codigo, body.Descricao, body.Ncm,
            body.Unidade, body.PrecoUnitario, body.Cfop,
            body.AliquotaIcms, body.AliquotaPis, body.AliquotaCofins, body.Ativo,
            body.CstIcms, body.CstPis, body.CstCofins, body.IcmsOrigem, body.IbsCbsCst, body.IbsCbsClassificacaoTributaria,
            body.ValorCusto, body.PercentualImposto, body.CstIpi, body.AliquotaIpi), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProdutoCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpGet("{id:guid}/vizinhos")]
    public async Task<IActionResult> GetVizinhos(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProdutoVizinhosQuery(clienteId, id), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("{id:guid}/duplicar")]
    public async Task<IActionResult> Duplicar(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DuplicarProdutoCommand(id, clienteId), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : NotFound(result.Error);
    }

    [HttpPatch("ativo-lote")]
    public async Task<IActionResult> BulkAtivar(Guid clienteId, [FromBody] BulkAtivoRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new BulkAtivarProdutoCommand(clienteId, body.Ids, body.Ativo), ct);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    private static readonly string[] ProdutoColunas =
        ["Codigo", "Descricao", "Unidade", "PrecoUnitario", "NCM", "CFOP", "AliquotaICMS", "AliquotaPIS", "AliquotaCOFINS", "CST_ICMS", "CST_PIS", "CST_COFINS", "Ativo"];

    [HttpGet("exportar")]
    public async Task<IActionResult> Exportar(Guid clienteId, [FromQuery] string? termo, [FromQuery] bool? ativo, CancellationToken ct)
    {
        var result = await mediator.Send(new GetProdutosQuery(clienteId, termo, ativo, 1, int.MaxValue), ct);
        if (!result.IsSuccess) return BadRequest(result.Error);

        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add("Produtos");
        for (var i = 0; i < ProdutoColunas.Length; i++) ws.Cell(1, i + 1).Value = ProdutoColunas[i];

        var linha = 2;
        foreach (var p in result.Value!.Items)
        {
            ws.Cell(linha, 1).Value = p.Codigo;
            ws.Cell(linha, 2).Value = p.Descricao;
            ws.Cell(linha, 3).Value = p.Unidade;
            ws.Cell(linha, 4).Value = p.PrecoUnitario;
            ws.Cell(linha, 5).Value = p.Ncm ?? "";
            ws.Cell(linha, 6).Value = p.Cfop ?? "";
            ws.Cell(linha, 7).Value = p.AliquotaIcms;
            ws.Cell(linha, 8).Value = p.AliquotaPis;
            ws.Cell(linha, 9).Value = p.AliquotaCofins;
            ws.Cell(linha, 10).Value = p.CstIcms ?? "";
            ws.Cell(linha, 11).Value = p.CstPis ?? "";
            ws.Cell(linha, 12).Value = p.CstCofins ?? "";
            ws.Cell(linha, 13).Value = p.Ativo ? "Sim" : "Não";
            linha++;
        }
        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "produtos.xlsx");
    }

    // Só cria produtos novos (não atualiza existentes) — mesma planilha exportada serve de
    // modelo pra preencher, então as colunas precisam bater exatamente com ProdutoColunas.
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
            var codigo = linha.Cell(1).GetString().Trim();
            var descricao = linha.Cell(2).GetString().Trim();
            var unidade = linha.Cell(3).GetString().Trim();
            if (string.IsNullOrWhiteSpace(codigo) || string.IsNullOrWhiteSpace(descricao))
            {
                erros.Add($"Linha {linha.RowNumber()}: código e descrição são obrigatórios.");
                continue;
            }

            var precoUnitario = linha.Cell(4).IsEmpty() ? 0 : linha.Cell(4).GetValue<decimal>();
            var ncm = linha.Cell(5).GetString().Trim();
            var cfop = linha.Cell(6).GetString().Trim();
            var aliquotaIcms = linha.Cell(7).IsEmpty() ? 0 : linha.Cell(7).GetValue<decimal>();
            var aliquotaPis = linha.Cell(8).IsEmpty() ? 0 : linha.Cell(8).GetValue<decimal>();
            var aliquotaCofins = linha.Cell(9).IsEmpty() ? 0 : linha.Cell(9).GetValue<decimal>();
            var cstIcms = linha.Cell(10).GetString().Trim();
            var cstPis = linha.Cell(11).GetString().Trim();
            var cstCofins = linha.Cell(12).GetString().Trim();

            var result = await mediator.Send(new CreateProdutoCommand(
                clienteId, codigo, descricao,
                string.IsNullOrWhiteSpace(ncm) ? null : ncm,
                string.IsNullOrWhiteSpace(unidade) ? "UN" : unidade,
                precoUnitario,
                string.IsNullOrWhiteSpace(cfop) ? null : cfop,
                aliquotaIcms, aliquotaPis, aliquotaCofins,
                string.IsNullOrWhiteSpace(cstIcms) ? null : cstIcms,
                string.IsNullOrWhiteSpace(cstPis) ? null : cstPis,
                string.IsNullOrWhiteSpace(cstCofins) ? null : cstCofins), ct);

            if (result.IsSuccess) criados++;
            else erros.Add($"Linha {linha.RowNumber()}: {result.Error?.Description}");
        }

        return Ok(new { criados, erros });
    }
}

public record BulkAtivoRequest(List<Guid> Ids, bool Ativo);

public record CreateProdutoRequest(
    string Codigo,
    string Descricao,
    string? Ncm,
    string Unidade,
    decimal PrecoUnitario,
    string? Cfop,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins,
    string? CstIcms = null,
    string? CstPis = null,
    string? CstCofins = null,
    int IcmsOrigem = 0,
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null,
    decimal ValorCusto = 0,
    decimal PercentualImposto = 0,
    string? CstIpi = null,
    decimal AliquotaIpi = 0
);

public record UpdateProdutoRequest(
    string Codigo,
    string Descricao,
    string? Ncm,
    string Unidade,
    decimal PrecoUnitario,
    string? Cfop,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins,
    bool Ativo,
    string? CstIcms = null,
    string? CstPis = null,
    string? CstCofins = null,
    int IcmsOrigem = 0,
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null,
    decimal ValorCusto = 0,
    decimal PercentualImposto = 0,
    string? CstIpi = null,
    decimal AliquotaIpi = 0
);
