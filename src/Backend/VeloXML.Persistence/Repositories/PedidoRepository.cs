using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class PedidoRepository(AppDbContext context) : BaseRepository<Pedido>(context), IPedidoRepository
{
    public async Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, string? termo, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(p => p.Destinatario).Where(p => p.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrWhiteSpace(termo))
        {
            var numeroTermo = int.TryParse(termo, out var n) ? n : (int?)null;
            query = query.Where(p =>
                (numeroTermo != null && p.Numero == numeroTermo) ||
                (p.Destinatario != null && EF.Functions.ILike(p.Destinatario.RazaoSocial, $"%{termo}%")));
        }

        // CreatedAt é "timestamp with time zone" — o Npgsql exige DateTimeKind.Utc explícito,
        // mas o model binding da query string sempre entrega Kind=Unspecified.
        if (de.HasValue) query = query.Where(p => p.CreatedAt >= DateTime.SpecifyKind(de.Value, DateTimeKind.Utc));
        if (ate.HasValue) query = query.Where(p => p.CreatedAt <= DateTime.SpecifyKind(ate.Value, DateTimeKind.Utc));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(p => p.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Pedido>.Create(items, total, page, pageSize);
    }

    public async Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(p => p.Destinatario).Include(p => p.Documento).Include(p => p.Itens).ThenInclude(i => i.Produto)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    // Marca o estado de cada PedidoItem explicitamente (Remove/Add) em vez de
    // confiar na detecção automática de Itens.Clear()+Add() dentro do mesmo
    // SaveChanges que também modifica o Pedido pai — nesse cenário o EF Core
    // pode classificar os itens novos como "Modified" em vez de "Added",
    // gerando UPDATE de linhas inexistentes (DbUpdateConcurrencyException).
    public void SubstituirItens(IEnumerable<PedidoItem> remover, IEnumerable<PedidoItem> adicionar)
    {
        foreach (var item in remover)
            context.Remove(item);

        foreach (var item in adicionar)
            context.Add(item);
    }
}
