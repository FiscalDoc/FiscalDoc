using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class ClienteRepository(AppDbContext context) : BaseRepository<Cliente>(context), IClienteRepository
{
    public async Task<PagedResult<Cliente>> SearchAsync(string? termo, Guid? contadorId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(c => c.Contador).AsQueryable();

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(c => EF.Functions.ILike(c.RazaoSocial, $"%{termo}%") || c.Cnpj.Contains(termo));

        if (contadorId.HasValue)
            query = query.Where(c => c.ContadorId == contadorId.Value);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderBy(c => c.RazaoSocial).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<Cliente>.Create(items, total, page, pageSize);
    }

    public async Task<Cliente?> GetByCnpjAsync(string cnpj, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.Cnpj == cnpj, ct);

    public async Task<Cliente?> GetByAppKeyAsync(string appKey, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.AppKey == appKey, ct);

    // IgnoreQueryFilters porque o job de importação por e-mail (ImportarXmlEmailJob) varre
    // TODOS os clientes com IMAP habilitado no sistema, não só os do contador atual — então a
    // unicidade do e-mail também precisa valer globalmente, senão dois clientes de contadores
    // diferentes poderiam configurar o mesmo e-mail e o job ficaria ambíguo sobre a quem
    // atribuir os XMLs importados.
    public async Task<bool> ExisteImapEmailEmOutroClienteAsync(string email, Guid clienteIdAtual, CancellationToken ct = default) =>
        await DbSet.IgnoreQueryFilters().AnyAsync(c =>
            c.DeletedAt == null &&
            c.Id != clienteIdAtual &&
            c.ImapEmail != null &&
            c.ImapEmail.ToLower() == email.ToLower(), ct);
}
