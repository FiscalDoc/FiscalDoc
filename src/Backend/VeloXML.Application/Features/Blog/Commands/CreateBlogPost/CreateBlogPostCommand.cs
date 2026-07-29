using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.CreateBlogPost;

public record CreateBlogPostCommand(
    string Titulo,
    string? Slug,
    string Resumo,
    string Conteudo,
    string? ImagemCapaKey,
    Guid? CategoriaId,
    List<string> Tags,
    string Autor,
    DateTime? DataPublicacao,
    string Status,
    string? MetaTitulo,
    string? MetaDescricao
) : IRequest<Result<BlogPostDto>>;
