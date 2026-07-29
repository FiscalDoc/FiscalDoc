using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetCobrancas;

public record GetCobrancasQuery(
    string? Termo,
    string? Tipo,
    string? Status,
    int? Mes,
    int? Ano,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<CobrancaDto>>>;
