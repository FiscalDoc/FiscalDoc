using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IDestinatarioRepository : IRepository<Destinatario>
{
    Task<PagedResult<Destinatario>> SearchAsync(Guid clienteId, string? termo, int page, int pageSize, CancellationToken ct = default);
}
