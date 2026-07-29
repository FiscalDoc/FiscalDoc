using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;

namespace VeloXML.Persistence.Repositories;

public sealed class BlogCategoriaRepository(AppDbContext context) : BaseRepository<BlogCategoria>(context), IBlogCategoriaRepository
{
    public new async Task<BlogCategoria?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null, ct);

    public async Task<IReadOnlyList<BlogCategoria>> GetAllOrderedAsync(CancellationToken ct = default) =>
        await DbSet.Where(c => c.DeletedAt == null).OrderBy(c => c.Nome).ToListAsync(ct);

    public async Task<bool> SlugExisteAsync(string slug, Guid? excludeId, CancellationToken ct = default) =>
        await DbSet.AnyAsync(c =>
            c.DeletedAt == null && c.Slug == slug && (excludeId == null || c.Id != excludeId), ct);
}
