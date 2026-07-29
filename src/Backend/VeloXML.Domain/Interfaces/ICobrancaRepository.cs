using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface ICobrancaRepository : IRepository<Cobranca>
{
    Task<Cobranca?> GetByContadorMesAsync(Guid contadorId, int mes, int ano, CancellationToken ct = default);
    Task<IReadOnlyList<Cobranca>> GetByContadorAsync(Guid contadorId, CancellationToken ct = default);
    Task<Cobranca?> GetCobrancaAtualAsync(Guid contadorId, CancellationToken ct = default);
    Task<IReadOnlyList<Cobranca>> GetByContadoresMesAsync(IEnumerable<Guid> contadorIds, int mes, int ano, CancellationToken ct = default);
    Task<IReadOnlyList<Cobranca>> GetByClienteAsync(Guid clienteId, CancellationToken ct = default);

    Task<PagedResult<Cobranca>> SearchAsync(
        string? termo, string? tipo, string? status, int? mes, int? ano, int page, int pageSize, CancellationToken ct = default);

    Task<IReadOnlyList<Cobranca>> GetAllPendentesEAtrasadasAsync(CancellationToken ct = default);
    Task<decimal> SomaPagasNoMesAsync(int mes, int ano, CancellationToken ct = default);
}
