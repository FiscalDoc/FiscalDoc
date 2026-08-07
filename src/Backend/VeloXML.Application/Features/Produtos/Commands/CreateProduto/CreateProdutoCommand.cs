using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Produtos.Commands.CreateProduto;

public record CreateProdutoCommand(
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
    string? CstIcms = null,
    string? CstPis = null,
    string? CstCofins = null,
    int IcmsOrigem = 0,
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null,
    decimal ValorCusto = 0,
    decimal PercentualImposto = 0
) : IRequest<Result<ProdutoDto>>;

public record ProdutoDto(
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
    DateTime CriadoEm,
    string? CstIcms,
    string? CstPis,
    string? CstCofins,
    int IcmsOrigem,
    string? IbsCbsCst,
    string? IbsCbsClassificacaoTributaria,
    decimal ValorCusto,
    decimal PercentualImposto
);
