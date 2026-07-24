using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IAlertaRepository : IRepository<Alerta>
{
    Task<PagedResult<Alerta>> GetByClienteAsync(Guid clienteId, StatusAlertaEnum? status, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountAtivosAsync(Guid? clienteId, CancellationToken ct = default);
}
