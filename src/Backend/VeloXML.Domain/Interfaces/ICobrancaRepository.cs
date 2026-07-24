using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface ICobrancaRepository : IRepository<CobrancaContador>
{
    Task<CobrancaContador?> GetByContadorMesAsync(Guid contadorId, int mes, int ano, CancellationToken ct = default);
    Task<IReadOnlyList<CobrancaContador>> GetByContadorAsync(Guid contadorId, CancellationToken ct = default);
    Task<CobrancaContador?> GetCobrancaAtualAsync(Guid contadorId, CancellationToken ct = default);
    Task<IReadOnlyList<CobrancaContador>> GetByContadoresMesAsync(IEnumerable<Guid> contadorIds, int mes, int ano, CancellationToken ct = default);
}
