using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Interfaces;

public interface IBlogPostRepository : IRepository<BlogPost>
{
    Task<BlogPost?> GetByIdComCategoriaAsync(Guid id, CancellationToken ct = default);
    Task<BlogPost?> GetBySlugPublicoAsync(string slug, CancellationToken ct = default);
    Task<bool> SlugExisteAsync(string slug, Guid? excludeId, CancellationToken ct = default);

    Task<PagedResult<BlogPost>> SearchAdminAsync(
        string? termo, string? status, Guid? categoriaId, int page, int pageSize, CancellationToken ct = default);

    Task<PagedResult<BlogPost>> SearchPublicAsync(
        string? termo, string? categoriaSlug, int page, int pageSize, CancellationToken ct = default);
}
