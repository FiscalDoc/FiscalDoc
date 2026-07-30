using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IImportacaoXmlLogRepository : IRepository<ImportacaoXmlLog>
{
    Task<PagedResult<ImportacaoXmlLog>> SearchAsync(Guid? clienteId, int page, int pageSize, CancellationToken ct = default);
}
