using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Application.Features.Produtos.Commands.DeleteProduto;
using VeloXML.Application.Features.Produtos.Commands.UpdateProduto;
using VeloXML.Application.Features.Produtos.Queries.GetProdutoById;
using VeloXML.Application.Features.Produtos.Queries.GetProdutos;

namespace VeloXML.API.Controllers.v1;

[ApiController]
[Route("api/v1/clientes/{clienteId:guid}/produtos")]
[Authorize]
public sealed class ProdutosController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(Guid clienteId, [FromQuery] string? termo, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetProdutosQuery(clienteId, termo, page, pageSize), ct);
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
            body.AliquotaIcms, body.AliquotaPis, body.AliquotaCofins), ct);
        return result.IsSuccess ? Created(string.Empty, result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid clienteId, Guid id, [FromBody] UpdateProdutoRequest body, CancellationToken ct)
    {
        var result = await mediator.Send(new UpdateProdutoCommand(
            id, clienteId, body.Codigo, body.Descricao, body.Ncm,
            body.Unidade, body.PrecoUnitario, body.Cfop,
            body.AliquotaIcms, body.AliquotaPis, body.AliquotaCofins, body.Ativo), ct);
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid clienteId, Guid id, CancellationToken ct)
    {
        var result = await mediator.Send(new DeleteProdutoCommand(id, clienteId), ct);
        return result.IsSuccess ? NoContent() : NotFound(result.Error);
    }
}

public record CreateProdutoRequest(
    string Codigo,
    string Descricao,
    string? Ncm,
    string Unidade,
    decimal PrecoUnitario,
    string? Cfop,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins
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
    bool Ativo
);
