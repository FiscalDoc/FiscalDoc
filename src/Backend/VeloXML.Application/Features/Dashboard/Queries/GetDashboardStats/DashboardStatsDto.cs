namespace VeloXML.Application.Features.Dashboard.Queries.GetDashboardStats;

public record DashboardStatsDto(
    int TotalDocumentos,
    int TotalDocumentosHoje,
    decimal ValorTotalMes,
    int AlertasAtivos,
    int PendenciasAtivas,
    int TotalClientes,
    int Duplicados,
    IReadOnlyList<DocumentoPorMesDto> DocumentosPorMes,
    IReadOnlyList<DocumentoPorTipoDto> DocumentosPorTipo,
    IReadOnlyList<TopClienteDto> TopClientes
);

public record DocumentoPorMesDto(int Ano, int Mes, string Label, int Quantidade, decimal Valor);

public record DocumentoPorTipoDto(string Tipo, int Quantidade, decimal Percentual);

public record TopClienteDto(Guid ClienteId, string Nome, int TotalDocumentos, decimal ValorTotal);
