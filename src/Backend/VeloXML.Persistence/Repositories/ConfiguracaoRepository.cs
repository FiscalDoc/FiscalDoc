using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class ConfiguracaoRepository(AppDbContext context) : BaseRepository<Configuracao>(context), IConfiguracaoRepository
{
    public async Task<Configuracao?> GetByChaveAsync(string chave, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(c => c.Chave == chave, ct);

    public async Task<IReadOnlyList<Configuracao>> GetByPrefixoAsync(string prefixo, CancellationToken ct = default) =>
        await DbSet.Where(c => c.Chave.StartsWith(prefixo)).ToListAsync(ct);

    public async Task UpsertAsync(string chave, string valor, string? descricao, CancellationToken ct = default)
    {
        var existing = await GetByChaveAsync(chave, ct);
        if (existing is null)
        {
            await AddAsync(new Configuracao { Chave = chave, Valor = valor, Descricao = descricao, Global = true }, ct);
        }
        else
        {
            existing.Valor = valor;
            if (descricao is not null) existing.Descricao = descricao;
            Update(existing);
        }
    }
}
