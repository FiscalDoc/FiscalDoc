using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutos;

public record GetProdutosQuery(
    Guid ClienteId,
    string? Termo,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<ProdutoDto>>>;
