using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class PedidoRepository(AppDbContext context) : BaseRepository<Pedido>(context), IPedidoRepository
{
    public async Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, string? termo, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(p => p.Destinatario).Include(p => p.Documento).Include(p => p.Transportadora).Where(p => p.ClienteId == clienteId).AsQueryable();

        // "status" aqui reflete o que a tela realmente mostra na coluna Status, não o
        // Pedido.Status cru — um Pedido "Emitido" cuja NF-e foi cancelada depois continua com
        // Status="Emitido" no banco, mas a UI mostra "Cancelada" (vermelho), então o filtro
        // "Cancelada" precisa enxergar esse caso, senão ele nunca aparece ao filtrar.
        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status switch
            {
                "Rascunho" => query.Where(p => p.Status == "Rascunho"),
                "Autorizada" => query.Where(p => p.Status == "Emitido"
                    && (p.Documento == null || p.Documento.Status != StatusDocumentoEnum.Cancelado)),
                "Cancelada" => query.Where(p => p.Status == "Cancelado"
                    || (p.Documento != null && p.Documento.Status == StatusDocumentoEnum.Cancelado)),
                _ => query.Where(p => p.Status == status),
            };
        }

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
        await DbSet.Include(p => p.Destinatario).Include(p => p.Documento).Include(p => p.Transportadora).Include(p => p.Itens).ThenInclude(i => i.Produto)
            .FirstOrDefaultAsync(p => p.Id == id, ct);

    // "Anterior/Próximo" navega pelo número sequencial do pedido dentro do mesmo cliente —
    // mais previsível pro usuário do que ordenar por data de criação, já que o número é o
    // identificador visível no cabeçalho ("Pedido 1001").
    public async Task<(Guid? AnteriorId, int? AnteriorNumero, Guid? ProximoId, int? ProximoNumero, int Posicao, int Total)> GetVizinhosAsync(
        Guid clienteId, int numero, CancellationToken ct = default)
    {
        var anterior = await DbSet
            .Where(p => p.ClienteId == clienteId && p.Numero < numero)
            .OrderByDescending(p => p.Numero)
            .Select(p => new { p.Id, p.Numero })
            .FirstOrDefaultAsync(ct);

        var proximo = await DbSet
            .Where(p => p.ClienteId == clienteId && p.Numero > numero)
            .OrderBy(p => p.Numero)
            .Select(p => new { p.Id, p.Numero })
            .FirstOrDefaultAsync(ct);

        var total = await DbSet.CountAsync(p => p.ClienteId == clienteId, ct);
        var posicao = await DbSet.CountAsync(p => p.ClienteId == clienteId && p.Numero <= numero, ct);

        return (anterior?.Id, anterior?.Numero, proximo?.Id, proximo?.Numero, posicao, total);
    }

    // Sugestão de "adicionar novamente" no formulário de pedido: produtos que esse
    // destinatário mais comprou historicamente, ordenados por frequência. Pedidos cancelados
    // não contam — não refletem o que o destinatário realmente costuma levar.
    public async Task<List<Guid>> GetProdutosFrequentesPorDestinatarioAsync(Guid clienteId, Guid destinatarioId, int top, CancellationToken ct = default) =>
        await context.Set<PedidoItem>()
            .Where(i => i.Pedido!.ClienteId == clienteId && i.Pedido.DestinatarioId == destinatarioId && i.Pedido.Status != "Cancelado")
            .GroupBy(i => i.ProdutoId)
            .OrderByDescending(g => g.Count())
            .Select(g => g.Key)
            .Take(top)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TopProdutoResumo>> GetTopProdutosAsync(Guid clienteId, DateTime de, DateTime ate, int limite, CancellationToken ct = default) =>
        await context.Set<PedidoItem>()
            .Where(i => i.Pedido!.ClienteId == clienteId && i.Pedido.Status != "Cancelado"
                && i.Pedido.CreatedAt >= DateTime.SpecifyKind(de, DateTimeKind.Utc)
                && i.Pedido.CreatedAt <= DateTime.SpecifyKind(ate, DateTimeKind.Utc))
            .GroupBy(i => new { i.ProdutoId, i.Descricao })
            .Select(g => new TopProdutoResumo(g.Key.ProdutoId, g.Key.Descricao, g.Sum(i => i.Quantidade), g.Sum(i => i.ValorTotal)))
            .OrderByDescending(r => r.ValorTotal)
            .Take(limite)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<TopDestinatarioResumo>> GetTopDestinatariosAsync(Guid clienteId, DateTime de, DateTime ate, int limite, CancellationToken ct = default) =>
        await DbSet
            .Where(p => p.ClienteId == clienteId && p.Status != "Cancelado"
                && p.CreatedAt >= DateTime.SpecifyKind(de, DateTimeKind.Utc)
                && p.CreatedAt <= DateTime.SpecifyKind(ate, DateTimeKind.Utc))
            .GroupBy(p => new { p.DestinatarioId, p.Destinatario!.RazaoSocial })
            .Select(g => new TopDestinatarioResumo(g.Key.DestinatarioId, g.Key.RazaoSocial, g.Count(), g.Sum(p => p.ValorTotal)))
            .OrderByDescending(r => r.ValorTotal)
            .Take(limite)
            .ToListAsync(ct);

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
