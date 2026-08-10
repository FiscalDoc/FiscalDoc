using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ContaReceberRepository(AppDbContext context) : BaseRepository<ContaReceber>(context), IContaReceberRepository
{
    public async Task<PagedResult<ContaReceber>> SearchAsync(Guid clienteId, string? status, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default)
    {
        var hoje = DateTime.UtcNow.Date;
        var query = DbSet.Include(c => c.Destinatario).Include(c => c.Pedido).Where(c => c.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status switch
            {
                "Pendente" => query.Where(c => c.Status == StatusContaReceberEnum.Pendente && c.DataVencimento >= hoje),
                "Atrasado" => query.Where(c => c.Status == StatusContaReceberEnum.Pendente && c.DataVencimento < hoje),
                "Pago" => query.Where(c => c.Status == StatusContaReceberEnum.Pago),
                "Cancelado" => query.Where(c => c.Status == StatusContaReceberEnum.Cancelado),
                _ => query,
            };
        }

        // DateTime "with time zone" no Postgres exige Kind=Utc explícito — o model binding da
        // query string sempre entrega Kind=Unspecified (mesmo detalhe já visto em Pedido).
        if (de.HasValue) query = query.Where(c => c.DataVencimento >= DateTime.SpecifyKind(de.Value, DateTimeKind.Utc));
        if (ate.HasValue) query = query.Where(c => c.DataVencimento <= DateTime.SpecifyKind(ate.Value, DateTimeKind.Utc));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(c => c.DataVencimento).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<ContaReceber>.Create(items, total, page, pageSize);
    }

    public async Task<ContaReceberResumo> GetResumoAsync(Guid clienteId, CancellationToken ct = default)
    {
        var hoje = DateTime.UtcNow.Date;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var fimMes = inicioMes.AddMonths(1);

        var pendentes = await DbSet
            .Where(c => c.ClienteId == clienteId && c.Status == StatusContaReceberEnum.Pendente)
            .Select(c => new { c.ValorTotal, c.DataVencimento })
            .ToListAsync(ct);

        var totalPendente = pendentes.Where(c => c.DataVencimento >= hoje).Sum(c => c.ValorTotal);
        var totalAtrasado = pendentes.Where(c => c.DataVencimento < hoje).Sum(c => c.ValorTotal);
        var qtdPendente = pendentes.Count(c => c.DataVencimento >= hoje);
        var qtdAtrasado = pendentes.Count(c => c.DataVencimento < hoje);

        var totalPagoNoMes = await DbSet
            .Where(c => c.ClienteId == clienteId && c.Status == StatusContaReceberEnum.Pago
                && c.DataPagamento >= inicioMes && c.DataPagamento < fimMes)
            .SumAsync(c => c.ValorTotal, ct);

        return new ContaReceberResumo(totalPendente, totalAtrasado, totalPagoNoMes, qtdPendente, qtdAtrasado);
    }
}
