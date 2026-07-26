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
        var produto = await uow.Produtos.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Produto", request.Id);

        uow.Produtos.Remove(produto);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
