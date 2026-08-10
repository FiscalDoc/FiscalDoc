using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IProdutoRepository : IRepository<Produto>
{
    Task<PagedResult<Produto>> SearchAsync(Guid clienteId, string? termo, bool? ativo, int page, int pageSize, CancellationToken ct = default);

    // PedidoItem.ProdutoId é Restrict (nunca Cascade) — um produto usado em qualquer pedido,
    // mesmo antigo/cancelado, não pode ser excluído no banco. Checado antes de tentar apagar
    // pra devolver uma mensagem clara em vez de deixar estourar violação de FK.
    Task<bool> EstaEmUsoAsync(Guid produtoId, CancellationToken ct = default);

    // "Anterior/Próximo" na tela de detalhe — mesma ordem alfabética (por Descrição) que a
    // grade usa, com Id como desempate pra ordem determinística entre itens de descrição igual.
    Task<(Guid? AnteriorId, string? AnteriorLabel, Guid? ProximoId, string? ProximoLabel, int Posicao, int Total)> GetVizinhosAsync(Guid clienteId, Guid id, CancellationToken ct = default);
}
