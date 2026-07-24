using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class DocumentoRepository(AppDbContext context) : BaseRepository<Documento>(context), IDocumentoRepository
{
    public async Task<PagedResult<Documento>> SearchAsync(string? termo, Guid? clienteId, TipoDocumentoEnum? tipo, StatusDocumentoEnum? status, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(d => d.Cliente).Include(d => d.Arquivos).Include(d => d.Alertas).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
        {
            var termoLimpo = termo.Replace(".", "").Replace("-", "").Replace("/", "").Replace(" ", "");
            query = query.Where(d =>
                EF.Functions.ILike(d.Numero, $"%{termo}%") ||
                (d.ChaveAcesso != null && EF.Functions.ILike(d.ChaveAcesso, $"%{termo}%")) ||
                (d.ChaveAcesso != null && EF.Functions.ILike(d.ChaveAcesso, $"%{termoLimpo}%")) ||
                (d.NomeEmitente != null && EF.Functions.ILike(d.NomeEmitente, $"%{termo}%")) ||
                (d.NomeDestinatario != null && EF.Functions.ILike(d.NomeDestinatario, $"%{termo}%")) ||
                (d.CnpjEmitente != null && EF.Functions.ILike(d.CnpjEmitente, $"%{termoLimpo}%")) ||
                (d.CnpjDestinatario != null && EF.Functions.ILike(d.CnpjDestinatario, $"%{termoLimpo}%")) ||
                (d.Cliente != null && EF.Functions.ILike(d.Cliente.RazaoSocial, $"%{termo}%")));
        }

        if (clienteId.HasValue) query = query.Where(d => d.ClienteId == clienteId.Value);
        if (tipo.HasValue) query = query.Where(d => d.Tipo == tipo.Value);
        if (status.HasValue) query = query.Where(d => d.Status == status.Value);
        if (de.HasValue) query = query.Where(d => d.DataEmissao >= de.Value);
        if (ate.HasValue) query = query.Where(d => d.DataEmissao <= ate.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(d => d.DataEmissao).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Documento>.Create(items, total, page, pageSize);
    }

    public async Task<Documento?> GetByChaveAcessoAsync(string chaveAcesso, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(d => d.ChaveAcesso == chaveAcesso, ct);

    public async Task<Documento?> GetByIdWithArquivosAsync(Guid id, CancellationToken ct = default) =>
        await DbSet
            .Include(d => d.Cliente)
            .Include(d => d.Arquivos)
            .Include(d => d.Alertas)
            .FirstOrDefaultAsync(d => d.Id == id, ct);

    public async Task<IReadOnlyList<Documento>> GetByClienteAsync(Guid clienteId, CancellationToken ct = default) =>
        await DbSet.Where(d => d.ClienteId == clienteId).ToListAsync(ct);

    public async Task<IReadOnlyList<Documento>> GetByClienteMesAsync(Guid clienteId, int mes, int ano, CancellationToken ct = default) =>
        await DbSet
            .Include(d => d.Cliente)
            .Include(d => d.Arquivos)
            .Where(d => d.ClienteId == clienteId
                     && d.DataEmissao.Month == mes
                     && d.DataEmissao.Year == ano)
            .OrderBy(d => d.DataEmissao)
            .ToListAsync(ct);
}
