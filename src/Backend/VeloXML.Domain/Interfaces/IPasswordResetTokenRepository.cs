using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface IPasswordResetTokenRepository : IRepository<PasswordResetToken>
{
    Task<PasswordResetToken?> GetByTokenAsync(string token, CancellationToken ct = default);
    Task<IReadOnlyList<PasswordResetToken>> GetAtivosPorUsuarioAsync(Guid userId, CancellationToken ct = default);
}
