using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutos;

public sealed class GetProdutosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetProdutosQuery, Result<PagedResult<ProdutoDto>>>
{
    public async Task<Result<PagedResult<ProdutoDto>>> Handle(GetProdutosQuery request, CancellationToken ct)
    {
        var paged = await uow.Produtos.SearchAsync(
            request.ClienteId, request.Termo, request.Page, request.PageSize, ct);

        var dto = PagedResult<ProdutoDto>.Create(
            paged.Items.Select(CreateProdutoCommandHandler.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
