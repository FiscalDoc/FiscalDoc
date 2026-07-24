namespace VeloXML.Application.Features.Dashboard.Queries.GetAdminDashboard;

public record AdminDashboardDto(
    int TotalContadores,
    int ContadoresAtivos,
    int ContadoresBloqueados,
    int TotalClientes,
    int ClientesAtivos,
    int CobrancasPendentes,
    int CobrancasAtrasadas,
    decimal ReceitaMesAtual,
    decimal ReceitaPendenteMes,
    IReadOnlyList<ContadorResumoDto> TopContadores
);

public record ContadorResumoDto(
    Guid Id,
    string Nome,
    string? Empresa,
    int TotalClientes,
    string StatusLicenca,
    decimal ValorMensal,
    string StatusCobranca
);
