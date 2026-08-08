using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface ITransportadoraRepository : IRepository<Transportadora>
{
    Task<PagedResult<Transportadora>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default);
}
