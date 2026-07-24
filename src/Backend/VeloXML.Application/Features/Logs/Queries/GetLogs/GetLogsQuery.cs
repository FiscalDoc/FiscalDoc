using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Logs.Queries.GetLogs;

public record GetLogsQuery(
    string? Categoria,
    string? Operacao,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<PagedResult<LogDto>>>;

public record LogDto(
    Guid Id,
    string Tabela,
    string Operacao,
    string? RegistroId,
    string? ValoresAntigos,
    string? ValoresNovos,
    string? UserId,
    string? IpAddress,
    DateTime CriadoEm
);
