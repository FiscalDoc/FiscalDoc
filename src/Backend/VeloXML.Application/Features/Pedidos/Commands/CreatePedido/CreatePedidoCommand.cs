using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public record CreatePedidoItemInput(
    Guid ProdutoId,
    string Descricao,
    string Unidade,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Desconto,
    string? Cfop,
    string? Ncm,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins
);

public record CreatePedidoCommand(
    Guid ClienteId,
    Guid DestinatarioId,
    string? Observacoes,
    List<CreatePedidoItemInput> Itens,
    string NaturezaOperacao,
    DateTime? DataSaida,
    string? FormaPagamento,
    string? MeioPagamento,
    string? InformacoesComplementares
) : IRequest<Result<PedidoDto>>;
