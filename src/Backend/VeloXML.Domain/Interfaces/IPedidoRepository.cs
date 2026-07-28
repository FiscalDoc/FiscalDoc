using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IPedidoRepository : IRepository<Pedido>
{
    Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct = default);
    void SubstituirItens(IEnumerable<PedidoItem> remover, IEnumerable<PedidoItem> adicionar);
}
