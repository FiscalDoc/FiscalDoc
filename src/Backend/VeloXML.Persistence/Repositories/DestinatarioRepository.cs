using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class DestinatarioRepository(AppDbContext context) : BaseRepository<Destinatario>(context), IDestinatarioRepository
{
    public async Task<PagedResult<Destinatario>> SearchAsync(Guid clienteId, string? termo, bool? ativo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(d => d.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(d => EF.Functions.ILike(d.RazaoSocial, $"%{termo}%") || (d.CpfCnpj != null && d.CpfCnpj.Contains(termo)));

        if (ativo.HasValue)
            query = query.Where(d => d.Ativo == ativo.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(d => d.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Destinatario>.Create(items, total, page, pageSize);
    }

    public async Task<(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total)> GetVizinhosAsync(
        Guid clienteId, Guid id, CancellationToken ct = default)
    {
        var itens = await DbSet.Where(d => d.ClienteId == clienteId)
            .OrderBy(d => d.RazaoSocial).ThenBy(d => d.Id)
            .Select(d => new { d.Id, d.RazaoSocial })
            .ToListAsync(ct);

        var idx = itens.FindIndex(d => d.Id == id);
        if (idx < 0) return (null, null, null, null, 0, itens.Count);

        var anterior = idx > 0 ? itens[idx - 1] : null;
        var proximo = idx < itens.Count - 1 ? itens[idx + 1] : null;
        return (anterior?.Id, anterior?.RazaoSocial, proximo?.Id, proximo?.RazaoSocial, idx + 1, itens.Count);
    }
}
