using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class PasswordResetTokenRepository(AppDbContext context)
    : BaseRepository<PasswordResetToken>(context), IPasswordResetTokenRepository
{
    public async Task<PasswordResetToken?> GetByTokenAsync(string token, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(t => t.Token == token, ct);

    public async Task<IReadOnlyList<PasswordResetToken>> GetAtivosPorUsuarioAsync(Guid userId, CancellationToken ct = default) =>
        await DbSet.Where(t => t.UserId == userId && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow).ToListAsync(ct);
}
