using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class AlertaRepository(AppDbContext context) : BaseRepository<Alerta>(context), IAlertaRepository
{
    public async Task<PagedResult<Alerta>> GetByClienteAsync(Guid clienteId, StatusAlertaEnum? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(a => a.Cliente).AsQueryable();

        if (clienteId != Guid.Empty)
            query = query.Where(a => a.ClienteId == clienteId);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(a => a.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Alerta>.Create(items, total, page, pageSize);
    }

    public async Task<int> CountAtivosAsync(Guid? clienteId, CancellationToken ct = default)
    {
        var query = DbSet.Where(a => a.Status == StatusAlertaEnum.Ativo);
        if (clienteId.HasValue && clienteId.Value != Guid.Empty)
            query = query.Where(a => a.ClienteId == clienteId.Value);
        return await query.CountAsync(ct);
    }
}
