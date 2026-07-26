using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IProdutoRepository : IRepository<Produto>
{
    Task<PagedResult<Produto>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default);
}
