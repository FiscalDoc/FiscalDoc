using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class PedidoRepository(AppDbContext context) : BaseRepository<Pedido>(context), IPedidoRepository
{
    public async Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(p => p.Destinatario).Where(p => p.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(p => p.CreatedAt).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Pedido>.Create(items, total, page, pageSize);
    }

    public async Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(p => p.Destinatario).Include(p => p.Itens).ThenInclude(i => i.Produto)
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
