using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class TransportadoraRepository(AppDbContext context) : BaseRepository<Transportadora>(context), ITransportadoraRepository
{
    public async Task<PagedResult<Transportadora>> SearchAsync(Guid clienteId, string? termo, bool? ativo, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Where(t => t.ClienteId == clienteId).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(t => EF.Functions.ILike(t.RazaoSocial, $"%{termo}%") || (t.CpfCnpj != null && t.CpfCnpj.Contains(termo)));

        if (ativo.HasValue)
            query = query.Where(t => t.Ativo == ativo.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(t => t.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Transportadora>.Create(items, total, page, pageSize);
    }

    public async Task<(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total)> GetVizinhosAsync(
        Guid clienteId, Guid id, CancellationToken ct = default)
    {
        var itens = await DbSet.Where(t => t.ClienteId == clienteId)
            .OrderBy(t => t.RazaoSocial).ThenBy(t => t.Id)
            .Select(t => new { t.Id, t.RazaoSocial })
            .ToListAsync(ct);

        var idx = itens.FindIndex(t => t.Id == id);
        if (idx < 0) return (null, null, null, null, 0, itens.Count);

        var anterior = idx > 0 ? itens[idx - 1] : null;
        var proximo = idx < itens.Count - 1 ? itens[idx + 1] : null;
        return (anterior?.Id, anterior?.RazaoSocial, proximo?.Id, proximo?.RazaoSocial, idx + 1, itens.Count);
    }
}
