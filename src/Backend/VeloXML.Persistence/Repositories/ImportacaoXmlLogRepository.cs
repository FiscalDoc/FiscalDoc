using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ImportacaoXmlLogRepository(AppDbContext context)
    : BaseRepository<ImportacaoXmlLog>(context), IImportacaoXmlLogRepository
{
    public async Task<PagedResult<ImportacaoXmlLog>> SearchAsync(
        Guid? clienteId, int page, int pageSize, CancellationToken ct = default)
    {
        var q = DbSet.AsNoTracking().AsQueryable();

        if (clienteId.HasValue)
            q = q.Where(l => l.ClienteId == clienteId.Value);

        q = q.OrderByDescending(l => l.ExecutadoEm);

        var total = await q.LongCountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<ImportacaoXmlLog>.Create(items, total, page, pageSize);
    }

    public async Task<(int TotalExecucoes, int TotalErros, DateTime? UltimaExecucaoEm)> GetResumoAsync(CancellationToken ct = default)
    {
        var q = DbSet.AsNoTracking();

        var totalExecucoes = await q.CountAsync(ct);
        if (totalExecucoes == 0)
            return (0, 0, null);

        var totalErros = await q.SumAsync(l => l.Erros, ct);
        var ultimaExecucaoEm = await q.MaxAsync(l => (DateTime?)l.ExecutadoEm, ct);
        return (totalExecucoes, totalErros, ultimaExecucaoEm);
    }
}
