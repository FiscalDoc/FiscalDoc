using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetByContadorIdAsync(Guid contadorId, CancellationToken ct = default);
    Task<User?> GetWithRefreshTokensAsync(Guid id, CancellationToken ct = default);
}
