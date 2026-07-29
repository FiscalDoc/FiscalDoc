using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Repositories;

public sealed class BlogPostRepository(AppDbContext context) : BaseRepository<BlogPost>(context), IBlogPostRepository
{
    public new async Task<BlogPost?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null, ct);

    public async Task<BlogPost?> GetByIdComCategoriaAsync(Guid id, CancellationToken ct = default) =>
        await DbSet.Include(p => p.Categoria)
            .FirstOrDefaultAsync(e => e.Id == id && e.DeletedAt == null, ct);

    public async Task<BlogPost?> GetBySlugPublicoAsync(string slug, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return await DbSet.Include(p => p.Categoria)
            .FirstOrDefaultAsync(p =>
                p.DeletedAt == null && p.Slug == slug &&
                p.Status == "Publicado" && p.DataPublicacao != null && p.DataPublicacao <= now, ct);
    }

    public async Task<bool> SlugExisteAsync(string slug, Guid? excludeId, CancellationToken ct = default) =>
        await DbSet.AnyAsync(p =>
            p.DeletedAt == null && p.Slug == slug && (excludeId == null || p.Id != excludeId), ct);

    public async Task<PagedResult<BlogPost>> SearchAdminAsync(
        string? termo, string? status, Guid? categoriaId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = DbSet.Include(p => p.Categoria).Where(p => p.DeletedAt == null);

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(p => p.Titulo.Contains(termo));
        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status == status);
        if (categoriaId.HasValue)
            query = query.Where(p => p.CategoriaId == categoriaId);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<BlogPost>.Create(items, total, page, pageSize);
    }

    public async Task<PagedResult<BlogPost>> SearchPublicAsync(
        string? termo, string? categoriaSlug, int page, int pageSize, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var query = DbSet.Include(p => p.Categoria).Where(p =>
            p.DeletedAt == null && p.Status == "Publicado" && p.DataPublicacao != null && p.DataPublicacao <= now);

        if (!string.IsNullOrWhiteSpace(termo))
            query = query.Where(p => p.Titulo.Contains(termo));
        if (!string.IsNullOrWhiteSpace(categoriaSlug))
            query = query.Where(p => p.Categoria != null && p.Categoria.Slug == categoriaSlug);

        var total = await query.LongCountAsync(ct);
        var items = await query.OrderByDescending(p => p.DataPublicacao)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return PagedResult<BlogPost>.Create(items, total, page, pageSize);
    }
}
