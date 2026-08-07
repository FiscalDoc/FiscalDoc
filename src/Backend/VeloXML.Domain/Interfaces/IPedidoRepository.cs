using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public record TopProdutoResumo(Guid ProdutoId, string Descricao, decimal Quantidade, decimal ValorTotal);
public record TopDestinatarioResumo(Guid DestinatarioId, string RazaoSocial, int QuantidadePedidos, decimal ValorTotal);

public interface IPedidoRepository : IRepository<Pedido>
{
    Task<PagedResult<Pedido>> SearchAsync(Guid clienteId, string? status, string? termo, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default);
    Task<Pedido?> GetWithItensAsync(Guid id, CancellationToken ct = default);
    Task<(Guid? AnteriorId, int? AnteriorNumero, Guid? ProximoId, int? ProximoNumero)> GetVizinhosAsync(Guid clienteId, int numero, CancellationToken ct = default);
    Task<List<Guid>> GetProdutosFrequentesPorDestinatarioAsync(Guid clienteId, Guid destinatarioId, int top, CancellationToken ct = default);
    void SubstituirItens(IEnumerable<PedidoItem> remover, IEnumerable<PedidoItem> adicionar);

    // Usados pelas ferramentas analíticas do assistente ("quais os produtos mais vendidos",
    // "quem são os maiores compradores") — Pedidos cancelados não contam, senão infla números
    // que na prática nunca viraram faturamento de verdade.
    Task<IReadOnlyList<TopProdutoResumo>> GetTopProdutosAsync(Guid clienteId, DateTime de, DateTime ate, int limite, CancellationToken ct = default);
    Task<IReadOnlyList<TopDestinatarioResumo>> GetTopDestinatariosAsync(Guid clienteId, DateTime de, DateTime ate, int limite, CancellationToken ct = default);
}
