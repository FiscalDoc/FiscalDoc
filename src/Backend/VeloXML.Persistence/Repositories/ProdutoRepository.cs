using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ProdutoRepository(AppDbContext context) : BaseRepository<Produto>(context), IProdutoRepository
{
    public async Task<PagedResult<Produto>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(p => p.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(p => p.Descricao.Contains(termo) || p.Codigo.Contains(termo));

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(p => p.Descricao).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Produto>.Create(items, total, page, pageSize);
    }
}
