using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.UpdateProduto;

public sealed class UpdateProdutoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateProdutoCommand, Result<ProdutoDto>>
{
    public async Task<Result<ProdutoDto>> Handle(UpdateProdutoCommand request, CancellationToken ct)
    {
        var produto = await uow.Produtos.GetByIdAsync(request.Id, ct);
        if (produto is null || produto.ClienteId != request.ClienteId)
            throw new NotFoundException("Produto", request.Id);

        produto.Codigo = request.Codigo;
        produto.Descricao = request.Descricao;
        produto.Ncm = request.Ncm;
        produto.Unidade = request.Unidade;
        produto.PrecoUnitario = request.PrecoUnitario;
        produto.Cfop = request.Cfop;
        produto.AliquotaIcms = request.AliquotaIcms;
        produto.AliquotaPis = request.AliquotaPis;
        produto.AliquotaCofins = request.AliquotaCofins;
        produto.Ativo = request.Ativo;
        produto.CstIcms = request.CstIcms;
        produto.CstPis = request.CstPis;
        produto.CstCofins = request.CstCofins;
        produto.IcmsOrigem = request.IcmsOrigem;
        produto.IbsCbsCst = request.IbsCbsCst;
        produto.IbsCbsClassificacaoTributaria = request.IbsCbsClassificacaoTributaria;

        uow.Produtos.Update(produto);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateProdutoCommandHandler.ToDto(produto));
    }
}
