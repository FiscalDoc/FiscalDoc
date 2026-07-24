using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class UserRepository(AppDbContext context) : BaseRepository<User>(context), IUserRepository
{
    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), ct);

    public async Task<User?> GetByContadorIdAsync(Guid contadorId, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(u => u.ContadorId == contadorId, ct);

    public async Task<User?> GetWithRefreshTokensAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(u => u.RefreshTokens).FirstOrDefaultAsync(u => u.Id == id, ct);
}
