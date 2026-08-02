using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IDocumentoRepository : IRepository<Documento>
{
    Task<PagedResult<Documento>> SearchAsync(string? termo, Guid? clienteId, TipoDocumentoEnum? tipo, StatusDocumentoEnum? status, OrigemImportacaoEnum? origem, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default);
    Task<Documento?> GetByChaveAcessoAsync(string chaveAcesso, CancellationToken ct = default);
    Task<Documento?> GetByIdWithArquivosAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<Documento>> GetByClienteAsync(Guid clienteId, CancellationToken ct = default);
    Task<IReadOnlyList<Documento>> GetByClienteMesAsync(Guid clienteId, int mes, int ano, CancellationToken ct = default);
}
