using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;

public record UpdatePedidoCommand(
    Guid Id,
    Guid ClienteId,
    Guid DestinatarioId,
    string? Observacoes,
    List<CreatePedidoItemInput> Itens,
    string NaturezaOperacao,
    DateTime? DataSaida,
    string? FormaPagamento,
    string? MeioPagamento,
    string? InformacoesComplementares,
    // "auto" = auto-save silencioso (não gera entrada no histórico do pedido, senão o
    // histórico ficaria cheio de "editado" repetido a cada poucos segundos digitando).
    string Origem = "manual"
) : IRequest<Result<PedidoDto>>;
