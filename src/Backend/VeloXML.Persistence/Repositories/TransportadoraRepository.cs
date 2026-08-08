using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class TransportadoraRepository(AppDbContext context) : BaseRepository<Transportadora>(context), ITransportadoraRepository
{
    public async Task<PagedResult<Transportadora>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(t => t.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(t => EF.Functions.ILike(t.RazaoSocial, $"%{termo}%") || (t.CpfCnpj != null && t.CpfCnpj.Contains(termo)));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(t => t.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Transportadora>.Create(items, total, page, pageSize);
    }
}
