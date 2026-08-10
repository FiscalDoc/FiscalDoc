using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.DuplicarProduto;

public sealed class DuplicarProdutoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DuplicarProdutoCommand, Result<ProdutoDto>>
{
    public async Task<Result<ProdutoDto>> Handle(DuplicarProdutoCommand request, CancellationToken ct)
    {
        var original = await uow.Produtos.GetByIdAsync(request.Id, ct);
        if (original is null || original.ClienteId != request.ClienteId)
            throw new NotFoundException("Produto", request.Id);

        // Código costuma servir de referência única na prática (mesmo sem constraint no banco)
        // — copiar sem alterar geraria dois produtos com o mesmo código, confuso na busca.
        var copia = new Produto
        {
            ClienteId = original.ClienteId,
            Codigo = $"{original.Codigo}-COPIA",
            Descricao = $"{original.Descricao} (cópia)",
            Ncm = original.Ncm,
            Unidade = original.Unidade,
            PrecoUnitario = original.PrecoUnitario,
            Cfop = original.Cfop,
            AliquotaIcms = original.AliquotaIcms,
            AliquotaPis = original.AliquotaPis,
            AliquotaCofins = original.AliquotaCofins,
            CstIcms = original.CstIcms,
            CstPis = original.CstPis,
            CstCofins = original.CstCofins,
            IcmsOrigem = original.IcmsOrigem,
            IbsCbsCst = original.IbsCbsCst,
            IbsCbsClassificacaoTributaria = original.IbsCbsClassificacaoTributaria,
            ValorCusto = original.ValorCusto,
            PercentualImposto = original.PercentualImposto,
            CstIpi = original.CstIpi,
            AliquotaIpi = original.AliquotaIpi,
        };

        await uow.Produtos.AddAsync(copia, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateProdutoCommandHandler.ToDto(copia));
    }
}
