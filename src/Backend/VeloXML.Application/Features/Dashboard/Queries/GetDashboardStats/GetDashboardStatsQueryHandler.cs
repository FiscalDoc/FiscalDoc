using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetDashboardStats;

public sealed class GetDashboardStatsQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetDashboardStatsQuery, Result<DashboardStatsDto>>
{
    private static readonly string[] MesNomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    public async Task<Result<DashboardStatsDto>> Handle(GetDashboardStatsQuery request, CancellationToken ct)
    {
        // Últimos 12 meses para o gráfico mensal
        var doze = DateTime.UtcNow.AddMonths(-11);
        var inicioDoze = new DateTime(doze.Year, doze.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        // Período para KPIs (ultimos N dias)
        var de = DateTime.UtcNow.AddDays(-request.UltimosDias);
        var paged = await uow.Documentos.SearchAsync(null, request.ClienteId, null, null, de, null, 1, 5000, ct);
        var docs  = paged.Items;

        // Todos docs dos últimos 12 meses (para o gráfico)
        var pagedMensal = await uow.Documentos.SearchAsync(null, request.ClienteId, null, null, inicioDoze, null, 1, 10000, ct);
        var docsMensal  = pagedMensal.Items;

        var hoje = DateTime.UtcNow.Date;
        var alertasAtivos = await uow.Alertas.CountAtivosAsync(request.ClienteId, ct);

        // Gráfico: agrupa por mês para os 12 meses anteriores
        var mesMap = docsMensal
            .GroupBy(d => new { d.DataEmissao.Year, d.DataEmissao.Month })
            .ToDictionary(g => g.Key, g => (Count: g.Count(), Valor: g.Sum(d => d.ValorTotal)));

        var porMes = Enumerable.Range(0, 12)
            .Select(i => inicioDoze.AddMonths(i))
            .Select(m =>
            {
                var key = new { m.Year, m.Month };
                mesMap.TryGetValue(key, out var v);
                return new DocumentoPorMesDto(m.Year, m.Month, MesNomes[m.Month - 1], v.Count, v.Valor);
            })
            .ToList();

        var porTipo = docs
            .GroupBy(d => d.Tipo.ToString())
            .Select(g => new DocumentoPorTipoDto(g.Key, g.Count(),
                docs.Count > 0 ? Math.Round((decimal)g.Count() / docs.Count * 100, 1) : 0))
            .ToList();

        var topClientes = docs
            .GroupBy(d => new { d.ClienteId, d.Cliente?.RazaoSocial })
            .OrderByDescending(g => g.Sum(d => d.ValorTotal))
            .Take(5)
            .Select(g => new TopClienteDto(g.Key.ClienteId, g.Key.RazaoSocial ?? "—", g.Count(), g.Sum(d => d.ValorTotal)))
            .ToList();

        return Result.Success(new DashboardStatsDto(
            TotalDocumentos:      docs.Count,
            TotalDocumentosHoje:  docs.Count(d => d.DataEmissao.Date == hoje),
            ValorTotalMes:        docs.Sum(d => d.ValorTotal),
            AlertasAtivos:        alertasAtivos,
            PendenciasAtivas:     docs.Count(d => d.Status == Domain.Enums.StatusDocumentoEnum.Pendente),
            TotalClientes:        docs.Select(d => d.ClienteId).Distinct().Count(),
            Duplicados:           docs.Count(d => d.Status == Domain.Enums.StatusDocumentoEnum.Duplicado),
            DocumentosPorMes:     porMes,
            DocumentosPorTipo:    porTipo,
            TopClientes:          topClientes));
    }
}
