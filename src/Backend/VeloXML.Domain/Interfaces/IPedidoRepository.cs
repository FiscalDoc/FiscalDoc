using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IPedidoRepository : IRepository<Pedido>
{
    Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, string? termo, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default);
    Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct = default);
    Task<(Guid? AnteriorId, int? AnteriorNumero, Guid? ProximoId, int? ProximoNumero)> GetVizinhosAsync(Guid clienteId, int numero, CancellationToken ct = default);
    void SubstituirItens(IEnumerable<PedidoItem> remover, IEnumerable<PedidoItem> adicionar);
}
