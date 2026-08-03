using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IPedidoHistoricoRepository : IRepository<PedidoHistorico>
{
    Task<List<PedidoHistorico>> GetByPedidoAsync(Guid pedidoId, CancellationToken ct = default);
}
