using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Blog;

public static class BlogDtoMapper
{
    public static string? ImagemUrl(string? imagemCapaKey) =>
        imagemCapaKey is null ? null : $"/blog/imagens/{imagemCapaKey}";

    public static BlogPostDto ToDto(BlogPost p) => new(
        p.Id, p.Titulo, p.Slug, p.Resumo, p.Conteudo, ImagemUrl(p.ImagemCapaKey),
        p.CategoriaId, p.Categoria?.Nome, p.Tags, p.Autor, p.DataPublicacao,
        p.Status, p.Visualizacoes, p.MetaTitulo, p.MetaDescricao, p.CreatedAt);

    public static BlogPostResumoDto ToResumoDto(BlogPost p) => new(
        p.Id, p.Titulo, p.Slug, p.Resumo, ImagemUrl(p.ImagemCapaKey),
        p.Autor, p.DataPublicacao, p.Categoria?.Nome);

    public static BlogCategoriaDto ToDto(BlogCategoria c) => new(c.Id, c.Nome, c.Slug);
}
