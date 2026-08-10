using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.UpdateContaReceber;

public record UpdateContaReceberCommand(
    Guid Id,
    Guid ClienteId,
    Guid DestinatarioId,
    Guid? PedidoId,
    string Descricao,
    decimal ValorTotal,
    DateTime DataVencimento,
    string? Observacao
) : IRequest<Result<ContaReceberDto>>;
