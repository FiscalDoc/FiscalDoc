using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.DeleteProduto;

public sealed class DeleteProdutoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteProdutoCommand, Result>
{
    public async Task<Result> Handle(DeleteProdutoCommand request, CancellationToken ct)
    {
        var produto = await uow.Produtos.GetByIdAsync(request.Id, ct);
        if (produto is null || produto.ClienteId != request.ClienteId)
            throw new NotFoundException("Produto", request.Id);

        if (await uow.Produtos.EstaEmUsoAsync(produto.Id, ct))
            return Result.Failure(ResultError.Validation("Produto",
                "Este produto já foi usado em algum pedido e não pode ser excluído. Desmarque \"Produto ativo\" no cadastro pra deixar de usá-lo em novos pedidos, sem apagar o histórico."));

        uow.Produtos.Remove(produto);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
