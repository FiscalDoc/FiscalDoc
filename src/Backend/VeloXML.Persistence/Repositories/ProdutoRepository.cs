using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ProdutoRepository(AppDbContext context) : BaseRepository<Produto>(context), IProdutoRepository
{
    public async Task<PagedResult<Produto>> SearchAsync(Guid clienteId, string? termo, bool? ativo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(p => p.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(p => EF.Functions.ILike(p.Descricao, $"%{termo}%") || EF.Functions.ILike(p.Codigo, $"%{termo}%"));

        if (ativo.HasValue)
            query = query.Where(p => p.Ativo == ativo.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(p => p.Descricao).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Produto>.Create(items, total, page, pageSize);
    }

    public async Task<bool> EstaEmUsoAsync(Guid produtoId, CancellationToken ct = default) =>
        await context.Set<PedidoItem>().AnyAsync(i => i.ProdutoId == produtoId, ct);

    // Traz {Id, Descricao} de todos os produtos do cliente e acha os vizinhos em memória — o
    // volume por cliente é pequeno o bastante (cadastro de produtos, não histórico de eventos)
    // pra isso ser mais simples e confiável do que tentar traduzir comparação de string pro SQL.
    public async Task<(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total)> GetVizinhosAsync(
        Guid clienteId, Guid id, CancellationToken ct = default)
    {
        var itens = await DbSet.Where(p => p.ClienteId == clienteId)
            .OrderBy(p => p.Descricao).ThenBy(p => p.Id)
            .Select(p => new { p.Id, p.Descricao })
            .ToListAsync(ct);

        var idx = itens.FindIndex(p => p.Id == id);
        if (idx < 0) return (null, null, null, null, 0, itens.Count);

        var anterior = idx > 0 ? itens[idx - 1] : null;
        var proximo = idx < itens.Count - 1 ? itens[idx + 1] : null;
        return (anterior?.Id, anterior?.Descricao, proximo?.Id, proximo?.Descricao, idx + 1, itens.Count);
    }
}
