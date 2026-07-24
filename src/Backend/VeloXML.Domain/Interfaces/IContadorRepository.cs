using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IContadorRepository : IRepository<Contador>
{
    Task<PagedResult<Contador>> SearchAsync(string? termo, int page, int pageSize, CancellationToken ct = default);
    Task<Contador?> GetWithClientesAsync(Guid id, CancellationToken ct = default);
}
