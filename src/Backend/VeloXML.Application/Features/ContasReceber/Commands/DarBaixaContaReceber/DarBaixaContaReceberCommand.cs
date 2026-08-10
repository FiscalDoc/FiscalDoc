using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.DarBaixaContaReceber;

public record DarBaixaContaReceberCommand(
    Guid Id,
    Guid ClienteId,
    DateTime? DataPagamento,
    string? FormaPagamento
) : IRequest<Result<ContaReceberDto>>;
