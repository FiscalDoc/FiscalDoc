using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class NfeEmissaoRepository(AppDbContext context)
    : BaseRepository<NfeEmissao>(context), INfeEmissaoRepository
{
    public async Task<NfeEmissao?> GetByRefAsync(string refId, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(e => e.Ref == refId, ct);

    public async Task<NfeEmissao?> GetLatestByPedidoAsync(Guid pedidoId, CancellationToken ct = default) =>
        await DbSet.Where(e => e.PedidoId == pedidoId).OrderByDescending(e => e.CreatedAt).FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<NfeEmissao>> GetPendentesAsync(DateTime criadasAntesDe, CancellationToken ct = default) =>
        await DbSet.Where(e => e.Status == NfeEmissaoStatusEnum.Processando && e.CreatedAt < criadasAntesDe).ToListAsync(ct);

    public async Task<IReadOnlyList<NfeEmissao>> GetEmitidasNoPeriodoAsync(int mes, int ano, Guid? clienteId, CancellationToken ct = default)
    {
        var query = DbSet.Where(e =>
            (e.Status == NfeEmissaoStatusEnum.Autorizada || e.Status == NfeEmissaoStatusEnum.Cancelada)
            && e.CreatedAt.Month == mes && e.CreatedAt.Year == ano);

        if (clienteId.HasValue)
            query = query.Where(e => e.ClienteId == clienteId.Value);

        return await query.OrderByDescending(e => e.CreatedAt).ToListAsync(ct);
    }
}
