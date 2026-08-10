using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.BulkAtivarProduto;

public sealed class BulkAtivarProdutoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<BulkAtivarProdutoCommand, Result>
{
    public async Task<Result> Handle(BulkAtivarProdutoCommand request, CancellationToken ct)
    {
        var produtos = await uow.Produtos.FindAsync(p => p.ClienteId == request.ClienteId && request.Ids.Contains(p.Id), ct);
        foreach (var produto in produtos)
        {
            produto.Ativo = request.Ativo;
            uow.Produtos.Update(produto);
        }

        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
