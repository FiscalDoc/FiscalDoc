using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutoVizinhos;

public sealed class GetProdutoVizinhosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetProdutoVizinhosQuery, Result<ProdutoVizinhosDto>>
{
    public async Task<Result<ProdutoVizinhosDto>> Handle(GetProdutoVizinhosQuery request, CancellationToken ct)
    {
        var produto = await uow.Produtos.GetByIdAsync(request.Id, ct);
        if (produto is null || produto.ClienteId != request.ClienteId)
            return Result.Failure<ProdutoVizinhosDto>(ResultError.NotFound("Produto"));

        var (anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total) =
            await uow.Produtos.GetVizinhosAsync(request.ClienteId, request.Id, ct);

        return Result.Success(new ProdutoVizinhosDto(anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total));
    }
}
