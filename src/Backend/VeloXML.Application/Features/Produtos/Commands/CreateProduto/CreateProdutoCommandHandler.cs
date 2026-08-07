using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.CreateProduto;

public sealed class CreateProdutoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateProdutoCommand, Result<ProdutoDto>>
{
    public async Task<Result<ProdutoDto>> Handle(CreateProdutoCommand request, CancellationToken ct)
    {
        var produto = new Produto
        {
            ClienteId = request.ClienteId,
            Codigo = request.Codigo,
            Descricao = request.Descricao,
            Ncm = request.Ncm,
            Unidade = request.Unidade,
            PrecoUnitario = request.PrecoUnitario,
            Cfop = request.Cfop,
            AliquotaIcms = request.AliquotaIcms,
            AliquotaPis = request.AliquotaPis,
            AliquotaCofins = request.AliquotaCofins,
            CstIcms = request.CstIcms,
            CstPis = request.CstPis,
            CstCofins = request.CstCofins,
            IcmsOrigem = request.IcmsOrigem,
            IbsCbsCst = request.IbsCbsCst,
            IbsCbsClassificacaoTributaria = request.IbsCbsClassificacaoTributaria,
            ValorCusto = request.ValorCusto,
            PercentualImposto = request.PercentualImposto,
        };

        await uow.Produtos.AddAsync(produto, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(ToDto(produto));
    }

    internal static ProdutoDto ToDto(Produto p) => new(
        p.Id, p.ClienteId, p.Codigo, p.Descricao, p.Ncm,
        p.Unidade, p.PrecoUnitario, p.Cfop,
        p.AliquotaIcms, p.AliquotaPis, p.AliquotaCofins,
        p.Ativo, p.CreatedAt,
        p.CstIcms, p.CstPis, p.CstCofins, p.IcmsOrigem, p.IbsCbsCst, p.IbsCbsClassificacaoTributaria,
        p.ValorCusto, p.PercentualImposto);
}
