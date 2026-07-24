using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IAuditLogRepository : IRepository<AuditLog>
{
    Task<(IReadOnlyList<AuditLog> Items, int Total)> SearchAsync(
        string? categoria,
        string? tipo,
        int page,
        int pageSize,
        CancellationToken ct = default);
}
