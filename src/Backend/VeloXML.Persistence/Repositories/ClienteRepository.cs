using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ClienteRepository(AppDbContext context) : BaseRepository<Cliente>(context), IClienteRepository
{
    public async Task<PagedResult<Cliente>> SearchAsync(string? termo, Guid? contadorId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(c => c.Contador).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(c => c.RazaoSocial.Contains(termo) || c.Cnpj.Contains(termo));

        if (contadorId.HasValue)
            query = query.Where(c => c.ContadorId == contadorId.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(c => c.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Cliente>.Create(items, total, page, pageSize);
    }

    public async Task<Cliente?> GetByCnpjAsync(string cnpj, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.Cnpj == cnpj, ct);

    public async Task<Cliente?> GetByAppKeyAsync(string appKey, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.AppKey == appKey, ct);
}
