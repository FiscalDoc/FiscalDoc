using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IImportacaoXmlLogRepository : IRepository<ImportacaoXmlLog>
{
    Task<PagedResult<ImportacaoXmlLog>> SearchAsync(
        Guid? clienteId, OrigemImportacaoEnum? origem, int page, int pageSize, CancellationToken ct = default);
    Task<(int TotalExecucoes, int TotalErros, DateTime? UltimaExecucaoEm)> GetResumoAsync(
        OrigemImportacaoEnum? origem, CancellationToken ct = default);
}
