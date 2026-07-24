using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class CobrancaRepository(AppDbContext context) : BaseRepository<CobrancaContador>(context), ICobrancaRepository
{
    public async Task<CobrancaContador?> GetByContadorMesAsync(Guid contadorId, int mes, int ano, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.ContadorId == contadorId && c.Mes == mes && c.Ano == ano, ct);

    public async Task<IReadOnlyList<CobrancaContador>> GetByContadorAsync(Guid contadorId, CancellationToken ct = default) =>
        await DbSet
            .Where(c => c.ContadorId == contadorId)
            .OrderByDescending(c => c.Ano).ThenByDescending(c => c.Mes)
            .ToListAsync(ct);

    public async Task<CobrancaContador?> GetCobrancaAtualAsync(Guid contadorId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await DbSet.FirstOrDefaultAsync(
            c => c.ContadorId == contadorId && c.Mes == now.Month && c.Ano == now.Year, ct);
    }

    public async Task<IReadOnlyList<CobrancaContador>> GetByContadoresMesAsync(
        IEnumerable<Guid> contadorIds, int mes, int ano, CancellationToken ct = default)
    {
        var ids = contadorIds.ToList();
        return await DbSet
            .Where(c => ids.Contains(c.ContadorId) && c.Mes == mes && c.Ano == ano)
            .ToListAsync(ct);
    }
}
