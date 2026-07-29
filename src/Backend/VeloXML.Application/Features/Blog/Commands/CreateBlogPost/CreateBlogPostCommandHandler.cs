using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.CreateBlogPost;

public sealed class CreateBlogPostCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateBlogPostCommand, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(CreateBlogPostCommand request, CancellationToken ct)
    {
        BlogCategoria? categoria = null;
        if (request.CategoriaId.HasValue)
        {
            categoria = await uow.BlogCategorias.GetByIdAsync(request.CategoriaId.Value, ct);
            if (categoria is null)
                return Result.Failure<BlogPostDto>(ResultError.NotFound("Categoria"));
        }

        var slug = await BlogSlugResolver.ResolverAsync(uow, request.Titulo, request.Slug, null, ct);

        var post = new BlogPost
        {
            Titulo = request.Titulo,
            Slug = slug,
            Resumo = request.Resumo,
            Conteudo = request.Conteudo,
            ImagemCapaKey = request.ImagemCapaKey,
            CategoriaId = request.CategoriaId,
            Categoria = categoria,
            Tags = request.Tags,
            Autor = request.Autor,
            DataPublicacao = request.DataPublicacao,
            Status = request.Status,
            MetaTitulo = request.MetaTitulo,
            MetaDescricao = request.MetaDescricao,
        };

        await uow.BlogPosts.AddAsync(post, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
