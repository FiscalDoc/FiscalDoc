using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IConfiguracaoRepository : IRepository<Configuracao>
{
    Task<Configuracao?> GetByChaveAsync(string chave, CancellationToken ct = default);
    Task<IReadOnlyList<Configuracao>> GetByPrefixoAsync(string prefixo, CancellationToken ct = default);
    Task UpsertAsync(string chave, string valor, string? descricao, CancellationToken ct = default, Guid? tenantId = null);
}
