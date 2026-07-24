using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IArquivoRepository : IRepository<Arquivo>
{
    Task<IReadOnlyList<Arquivo>> GetByDocumentoAsync(Guid documentoId, CancellationToken ct = default);
}
