using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetAdminDashboard;

public sealed class GetAdminDashboardQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetAdminDashboardQuery, Result<AdminDashboardDto>>
{
    public async Task<Result<AdminDashboardDto>> Handle(GetAdminDashboardQuery request, CancellationToken ct)
    {
        var contadores = await uow.Contadores.GetAllAsync(ct);
        var clientes   = await uow.Clientes.GetAllAsync(ct);

        var now = DateTime.UtcNow;
        var contadorIds = contadores.Select(c => c.Id).ToList();
        var cobrancasMes = await uow.Cobrancas.GetByContadoresMesAsync(contadorIds, now.Month, now.Year, ct);
        var mapCob = cobrancasMes.ToDictionary(c => c.ContadorId);

        var totalContadores     = contadores.Count;
        var contadoresAtivos    = contadores.Count(c => c.StatusLicenca == StatusLicencaEnum.Ativo);
        var contadoresBloqueados = contadores.Count(c => c.StatusLicenca == StatusLicencaEnum.Bloqueado);
        var totalClientes       = clientes.Count;
        var clientesAtivos      = clientes.Count(c => c.Ativo);

        var cobPendentes  = cobrancasMes.Count(c => c.Status == StatusCobrancaEnum.Pendente);
        var cobAtrasadas  = cobrancasMes.Count(c => c.Status == StatusCobrancaEnum.Atrasado);
        var receitaMes    = cobrancasMes.Where(c => c.Status == StatusCobrancaEnum.Pago).Sum(c => c.ValorTotal);
        var receitaPend   = cobrancasMes.Where(c => c.Status != StatusCobrancaEnum.Pago).Sum(c => c.ValorTotal);

        var topContadores = contadores
            .OrderByDescending(c => mapCob.TryGetValue(c.Id, out var cb) ? cb.ValorTotal : c.Clientes.Count * c.ValorPorCliente)
            .Take(10)
            .Select(c =>
            {
                mapCob.TryGetValue(c.Id, out var cb);
                return new ContadorResumoDto(
                    c.Id, c.Nome, c.Empresa,
                    c.Clientes.Count(cl => cl.DeletedAt == null),
                    c.StatusLicenca.ToString(),
                    cb?.ValorTotal ?? c.Clientes.Count(cl => cl.DeletedAt == null) * c.ValorPorCliente,
                    cb?.Status.ToString() ?? "—");
            }).ToList();

        return Result.Success(new AdminDashboardDto(
            totalContadores, contadoresAtivos, contadoresBloqueados,
            totalClientes, clientesAtivos,
            cobPendentes, cobAtrasadas,
            receitaMes, receitaPend,
            topContadores));
    }
}
