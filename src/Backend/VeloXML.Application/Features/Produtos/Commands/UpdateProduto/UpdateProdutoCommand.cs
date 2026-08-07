using MediatR;
using VeloXML.Application.Features.Produtos.Commands.CreateProduto;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.UpdateProduto;

public record UpdateProdutoCommand(
    Guid Id,
    Guid ClienteId,
    string Codigo,
    string Descricao,
    string? Ncm,
    string Unidade,
    decimal PrecoUnitario,
    string? Cfop,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins,
    bool Ativo,
    string? CstIcms = null,
    string? CstPis = null,
    string? CstCofins = null,
    int IcmsOrigem = 0,
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null,
    decimal ValorCusto = 0,
    decimal PercentualImposto = 0
) : IRequest<Result<ProdutoDto>>;
