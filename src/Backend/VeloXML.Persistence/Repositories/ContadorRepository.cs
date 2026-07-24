using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ContadorRepository(AppDbContext context) : BaseRepository<Contador>(context), IContadorRepository
{
    public async Task<PagedResult<Contador>> SearchAsync(string? termo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(c => c.Clientes).AsQueryable();
        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(c => EF.Functions.ILike(c.Nome, $"%{termo}%") || EF.Functions.ILike(c.Email, $"%{termo}%"));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(c => c.Nome).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Contador>.Create(items, total, page, pageSize);
    }

    public async Task<Contador?> GetWithClientesAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(c => c.Clientes).FirstOrDefaultAsync(c => c.Id == id, ct);
}
