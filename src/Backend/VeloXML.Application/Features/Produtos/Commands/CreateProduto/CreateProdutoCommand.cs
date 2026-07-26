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
    decimal AliquotaCofins
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
    DateTime CriadoEm
);
