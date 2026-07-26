using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class DestinatarioRepository(AppDbContext context) : BaseRepository<Destinatario>(context), IDestinatarioRepository
{
    public async Task<PagedResult<Destinatario>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(d => d.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(d => d.RazaoSocial.Contains(termo) || (d.CpfCnpj != null && d.CpfCnpj.Contains(termo)));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(d => d.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Destinatario>.Create(items, total, page, pageSize);
    }
}
