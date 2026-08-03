using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class PedidoHistoricoRepository(AppDbContext context) : BaseRepository<PedidoHistorico>(context), IPedidoHistoricoRepository
{
    public async Task<List<PedidoHistorico>> GetByPedidoAsync(Guid pedidoId, CancellationToken ct = default) =>
        await DbSet.Where(h => h.PedidoId == pedidoId).OrderByDescending(h => h.CreatedAt).ToListAsync(ct);
}
