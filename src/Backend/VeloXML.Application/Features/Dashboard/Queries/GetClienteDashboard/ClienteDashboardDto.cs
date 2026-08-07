namespace VeloXML.Application.Features.Dashboard.Queries.GetClienteDashboard;

public record ClienteDashboardDto(
    int TotalDocumentos,
    int TotalNotasFiscais,
    int TotalPedidos,
    int PedidosRascunho,
    int PedidosEmitidos,
    int PedidosCancelados,
    decimal ValorTotalPedidosMes,
    decimal ValorTotalDocumentosMes,
    decimal FaturamentoTotalNotas,
    int AlertasAtivos,
    IReadOnlyList<DocumentoPorTipoClienteDto> DocumentosPorTipo,
    IReadOnlyList<DocumentoPorMesClienteDto> DocumentosPorMes
);

public record DocumentoPorTipoClienteDto(string Tipo, int Quantidade, decimal Percentual);

public record DocumentoPorMesClienteDto(int Ano, int Mes, string Label, int Quantidade);
