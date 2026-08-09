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
    decimal? ValorTotal,
    // Só calculado quando a nota tem um Pedido vinculado (dá pra saber quais Produtos foram
    // vendidos) e esses Produtos têm custo cadastrado — null quando não dá pra saber (nota
    // importada de XML externo, sem Pedido correspondente no sistema).
    decimal? Lucro
);

public record RelatorioNfeEmitidasDto(
    int TotalNotas,
    int TotalAutorizadas,
    int TotalCanceladas,
    decimal ValorTotal,
    decimal LucroTotal,
    // Quantas notas entraram na soma de LucroTotal — o resto não tinha Pedido vinculado pra
    // saber o custo, então LucroTotal é subestimado se esse número for menor que TotalNotas.
    int NotasComLucroCalculado,
    List<RelatorioNfeItemDto> Itens
);
