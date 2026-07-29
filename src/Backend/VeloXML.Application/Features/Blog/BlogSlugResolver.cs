using VeloXML.Application.Common;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Blog;

public static class BlogSlugResolver
{
    public static async Task<string> ResolverAsync(
        IUnitOfWork uow, string titulo, string? slugDesejado, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Gerar(string.IsNullOrWhiteSpace(slugDesejado) ? titulo : slugDesejado);
        var slug = baseSlug;
        var sufixo = 2;
        while (await uow.BlogPosts.SlugExisteAsync(slug, excludeId, ct))
            slug = $"{baseSlug}-{sufixo++}";
        return slug;
    }

    public static async Task<string> ResolverCategoriaAsync(
        IUnitOfWork uow, string nome, string? slugDesejado, Guid? excludeId, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Gerar(string.IsNullOrWhiteSpace(slugDesejado) ? nome : slugDesejado);
        var slug = baseSlug;
        var sufixo = 2;
        while (await uow.BlogCategorias.SlugExisteAsync(slug, excludeId, ct))
            slug = $"{baseSlug}-{sufixo++}";
        return slug;
    }
}
