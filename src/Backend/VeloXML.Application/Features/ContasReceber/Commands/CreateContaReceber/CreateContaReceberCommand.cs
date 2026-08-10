using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;

public record CreateContaReceberCommand(
    Guid ClienteId,
    Guid DestinatarioId,
    Guid? PedidoId,
    string Descricao,
    decimal ValorTotal,
    DateTime DataVencimento,
    string? Observacao
) : IRequest<Result<ContaReceberDto>>;

public record ContaReceberDto(
    Guid Id,
    Guid ClienteId,
    Guid DestinatarioId,
    string DestinatarioNome,
    Guid? PedidoId,
    int? PedidoNumero,
    string Descricao,
    decimal ValorTotal,
    DateTime DataVencimento,
    DateTime? DataPagamento,
    // Pendente | Atrasado (calculado) | Pago | Cancelado
    string Status,
    string? FormaPagamento,
    string? Observacao,
    DateTime CreatedAt
);
