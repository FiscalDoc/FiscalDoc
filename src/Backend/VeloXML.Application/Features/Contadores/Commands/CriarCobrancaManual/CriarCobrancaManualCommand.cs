using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.CriarCobrancaManual;

public record CriarCobrancaManualCommand(
    Guid? ContadorId,
    Guid? ClienteId,
    int Mes,
    int Ano,
    decimal ValorTotal,
    DateTime DataVencimento,
    string? Observacao
) : IRequest<Result<CobrancaDto>>;
