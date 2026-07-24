using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class AuditLogRepository(AppDbContext context) : BaseRepository<AuditLog>(context), IAuditLogRepository
{
    public async Task<(IReadOnlyList<AuditLog> Items, int Total)> SearchAsync(
        string? categoria,
        string? tipo,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var q = DbSet.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(categoria))
            q = q.Where(l => l.Tabela == categoria);

        if (!string.IsNullOrWhiteSpace(tipo))
            q = q.Where(l => l.Operacao == tipo);

        q = q.OrderByDescending(l => l.CreatedAt);

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }
}
