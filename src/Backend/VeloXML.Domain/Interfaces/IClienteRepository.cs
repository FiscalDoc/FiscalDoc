using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IClienteRepository : IRepository<Cliente>
{
    Task<PagedResult<Cliente>> SearchAsync(string? termo, Guid? contadorId, int page, int pageSize, CancellationToken ct = default);
    Task<Cliente?> GetByCnpjAsync(string cnpj, CancellationToken ct = default);
    Task<Cliente?> GetByAppKeyAsync(string appKey, CancellationToken ct = default);
}
