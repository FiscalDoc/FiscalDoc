using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetProdutosFrequentes;

public sealed class GetProdutosFrequentesQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetProdutosFrequentesQuery, Result<List<ProdutoDto>>>
{
    private const int Top = 6;

    public async Task<Result<List<ProdutoDto>>> Handle(GetProdutosFrequentesQuery request, CancellationToken ct)
    {
        var produtoIds = await uow.Pedidos.GetProdutosFrequentesPorDestinatarioAsync(
            request.ClienteId, request.DestinatarioId, Top, ct);

        if (produtoIds.Count == 0)
            return Result.Success(new List<ProdutoDto>());

        var produtos = await uow.Produtos.FindAsync(p => produtoIds.Contains(p.Id), ct);
        var porId = produtos.ToDictionary(p => p.Id);

        // Preserva a ordem de frequência retornada pelo repositório — FindAsync não garante ordem.
        var ordenados = produtoIds
            .Where(porId.ContainsKey)
            .Select(id => CreateProdutoCommandHandler.ToDto(porId[id]))
            .ToList();

        return Result.Success(ordenados);
    }
}
