using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfeEmitidas;

public record GetRelatorioNfeEmitidasQuery(Guid ClienteId, int Mes, int Ano) : IRequest<Result<RelatorioNfeEmitidasDto>>;

public record RelatorioNfeItemDto(
    string? UsuarioNome,
    DateTime Data,
    string? Numero,
    string? Serie,
    string Status,
    string? ChaveAcesso,
    decimal? ValorTotal
);

public record RelatorioNfeEmitidasDto(
    int TotalNotas,
    int TotalAutorizadas,
    int TotalCanceladas,
    decimal ValorTotal,
    List<RelatorioNfeItemDto> Itens
);
