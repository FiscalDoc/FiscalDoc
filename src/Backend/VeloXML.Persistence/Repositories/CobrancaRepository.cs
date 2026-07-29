using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class CobrancaRepository(AppDbContext context) : BaseRepository<Cobranca>(context), ICobrancaRepository
{
    public new async Task<Cobranca?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(c => c.Contador).Include(c => c.Cliente)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<Cobranca?> GetByContadorMesAsync(Guid contadorId, int mes, int ano, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.ContadorId == contadorId && c.Mes == mes && c.Ano == ano, ct);

    public async Task<IReadOnlyList<Cobranca>> GetByContadorAsync(Guid contadorId, CancellationToken ct = default) =>
        await DbSet.Include(c => c.Contador)
            .Where(c => c.ContadorId == contadorId)
            .OrderByDescending(c => c.Ano).ThenByDescending(c => c.Mes)
            .ToListAsync(ct);

    public async Task<Cobranca?> GetCobrancaAtualAsync(Guid contadorId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await DbSet.FirstOrDefaultAsync(
            c => c.ContadorId == contadorId && c.Mes == now.Month && c.Ano == now.Year, ct);
    }

    public async Task<IReadOnlyList<Cobranca>> GetByContadoresMesAsync(
        IEnumerable<Guid> contadorIds, int mes, int ano, CancellationToken ct = default)
    {
        var ids = contadorIds.ToList();
        return await DbSet
            .Where(c => c.ContadorId != null && ids.Contains(c.ContadorId.Value) && c.Mes == mes && c.Ano == ano)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Cobranca>> GetByClienteAsync(Guid clienteId, CancellationToken ct = default) =>
        await DbSet.Include(c => c.Cliente)
            .Where(c => c.ClienteId == clienteId)
            .OrderByDescending(c => c.Ano).ThenByDescending(c => c.Mes)
            .ToListAsync(ct);

    public async Task<PagedResult<Cobranca>> SearchAsync(
        string? termo, string? tipo, string? status, int? mes, int? ano, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(c => c.Contador).Include(c => c.Cliente).AsQueryable();

        if (tipo == "Contador") query = query.Where(c => c.ContadorId != null);
        else if (tipo == "Cliente") query = query.Where(c => c.ClienteId != null);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<StatusCobrancaEnum>(status, out var statusEnum))
            query = query.Where(c => c.Status == statusEnum);

        if (mes.HasValue) query = query.Where(c => c.Mes == mes);
        if (ano.HasValue) query = query.Where(c => c.Ano == ano);

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(c =>
                (c.Contador != null && c.Contador.Nome.Contains(termo)) ||
                (c.Cliente != null && c.Cliente.RazaoSocial.Contains(termo)));

        var total = await query.LongCountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.Ano).ThenByDescending(c => c.Mes).ThenByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync(ct);

        return PagedResult<Cobranca>.Create(items, total, page, pageSize);
    }

    public async Task<IReadOnlyList<Cobranca>> GetAllPendentesEAtrasadasAsync(CancellationToken ct = default) =>
        await DbSet
            .Where(c => c.Status == StatusCobrancaEnum.Pendente || c.Status == StatusCobrancaEnum.Atrasado)
            .ToListAsync(ct);

    public async Task<decimal> SomaPagasNoMesAsync(int mes, int ano, CancellationToken ct = default) =>
        await DbSet
            .Where(c => c.Status == StatusCobrancaEnum.Pago && c.DataPagamento != null
                && c.DataPagamento.Value.Month == mes && c.DataPagamento.Value.Year == ano)
            .SumAsync(c => c.ValorTotal, ct);
}
