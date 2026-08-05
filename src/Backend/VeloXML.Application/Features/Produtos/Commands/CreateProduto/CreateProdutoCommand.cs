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
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null
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
    string? IbsCbsCst,
    string? IbsCbsClassificacaoTributaria
);
