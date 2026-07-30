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

    public async Task UpsertAsync(string chave, string valor, string? descricao, CancellationToken ct = default, Guid? tenantId = null)
    {
        var existing = await GetByChaveAsync(chave, ct);
        if (existing is null)
        {
            var configuracao = new Configuracao { Chave = chave, Valor = valor, Descricao = descricao, Global = true };

            // Fora de uma requisição HTTP (ex.: job em background do Hangfire) não há usuário
            // logado pra derivar o tenant automaticamente no SaveChangesAsync — sem isso o
            // tenant_id ficaria vazio e violaria a FK obrigatória para tenants. Quem chama de um
            // contexto sem HttpContext deve informar explicitamente de qual tenant é o registro.
            if (tenantId.HasValue)
                configuracao.TenantId = tenantId.Value;

            await AddAsync(configuracao, ct);
        }
        else
        {
            existing.Valor = valor;
            if (descricao is not null) existing.Descricao = descricao;
            Update(existing);
        }
    }
}
