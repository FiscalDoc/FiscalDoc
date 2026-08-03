using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface INfeEmissaoRepository : IRepository<NfeEmissao>
{
    Task<NfeEmissao?> GetByRefAsync(string refId, CancellationToken ct = default);
    Task<NfeEmissao?> GetLatestByPedidoAsync(Guid pedidoId, CancellationToken ct = default);
    Task<IReadOnlyList<NfeEmissao>> GetPendentesAsync(DateTime criadasAntesDe, CancellationToken ct = default);
}
