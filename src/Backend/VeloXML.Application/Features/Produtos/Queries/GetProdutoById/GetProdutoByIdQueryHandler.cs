using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Queries.GetProdutoById;

public sealed class GetProdutoByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetProdutoByIdQuery, Result<ProdutoDto>>
{
    public async Task<Result<ProdutoDto>> Handle(GetProdutoByIdQuery request, CancellationToken ct)
    {
        var produto = await uow.Produtos.GetByIdAsync(request.Id, ct);
        if (produto is null || produto.ClienteId != request.ClienteId)
            throw new NotFoundException("Produto", request.Id);

        return Result.Success(CreateProdutoCommandHandler.ToDto(produto));
    }
}
