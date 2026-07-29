using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetCobrancasResumo;

public record GetCobrancasResumoQuery : IRequest<Result<CobrancasResumoDto>>;

public record CobrancasResumoDto(
    decimal TotalPendente,
    int QtdPendente,
    decimal TotalAtrasado,
    int QtdAtrasado,
    decimal TotalRecebidoMesAtual
);
