using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IProdutoRepository : IRepository<Produto>
{
    Task<PagedResult<Produto>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default);

    // PedidoItem.ProdutoId é Restrict (nunca Cascade) — um produto usado em qualquer pedido,
    // mesmo antigo/cancelado, não pode ser excluído no banco. Checado antes de tentar apagar
    // pra devolver uma mensagem clara em vez de deixar estourar violação de FK.
    Task<bool> EstaEmUsoAsync(Guid produtoId, CancellationToken ct = default);
}
