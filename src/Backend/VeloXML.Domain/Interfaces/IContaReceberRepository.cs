using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public record ContaReceberResumo(decimal TotalPendente, decimal TotalAtrasado, decimal TotalPagoNoMes, int QtdPendente, int QtdAtrasado);

public interface IContaReceberRepository : IRepository<ContaReceber>
{
    // "status" aceita Pendente/Pago/Cancelado/Atrasado — Atrasado não é gravado, é Pendente
    // com vencimento no passado (ver comentário no enum).
    Task<PagedResult<ContaReceber>> SearchAsync(Guid clienteId, string? status, DateTime? de, DateTime? ate, int page, int pageSize, CancellationToken ct = default);
    Task<ContaReceberResumo> GetResumoAsync(Guid clienteId, CancellationToken ct = default);
}
