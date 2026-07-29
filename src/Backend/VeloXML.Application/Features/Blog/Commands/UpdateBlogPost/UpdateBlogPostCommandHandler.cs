using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.UpdateBlogPost;

public sealed class UpdateBlogPostCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateBlogPostCommand, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(UpdateBlogPostCommand request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetByIdAsync(request.Id, ct);
        if (post is null)
            throw new NotFoundException("BlogPost", request.Id);

        BlogCategoria? categoria = null;
        if (request.CategoriaId.HasValue)
        {
            categoria = await uow.BlogCategorias.GetByIdAsync(request.CategoriaId.Value, ct);
            if (categoria is null)
                return Result.Failure<BlogPostDto>(ResultError.NotFound("Categoria"));
        }

        var slug = await BlogSlugResolver.ResolverAsync(uow, request.Titulo, request.Slug, request.Id, ct);

        post.Titulo = request.Titulo;
        post.Slug = slug;
        post.Resumo = request.Resumo;
        post.Conteudo = request.Conteudo;
        post.ImagemCapaKey = request.ImagemCapaKey;
        post.CategoriaId = request.CategoriaId;
        post.Categoria = categoria;
        post.Tags = request.Tags;
        post.Autor = request.Autor;
        post.DataPublicacao = request.DataPublicacao;
        post.Status = request.Status;
        post.MetaTitulo = request.MetaTitulo;
        post.MetaDescricao = request.MetaDescricao;

        uow.BlogPosts.Update(post);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
