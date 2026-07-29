namespace VeloXML.Application.Features.Blog;

public record BlogPostDto(
    Guid Id,
    string Titulo,
    string Slug,
    string Resumo,
    string Conteudo,
    string? ImagemUrl,
    Guid? CategoriaId,
    string? CategoriaNome,
    List<string> Tags,
    string Autor,
    DateTime? DataPublicacao,
    string Status,
    int Visualizacoes,
    string? MetaTitulo,
    string? MetaDescricao,
    DateTime CriadoEm
);

public record BlogPostResumoDto(
    Guid Id,
    string Titulo,
    string Slug,
    string Resumo,
    string? ImagemUrl,
    string Autor,
    DateTime? DataPublicacao,
    string? CategoriaNome
);

public record BlogCategoriaDto(Guid Id, string Nome, string Slug);
