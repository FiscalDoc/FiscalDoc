using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.PublicarBlogPost;

public sealed class PublicarBlogPostCommandHandler(IUnitOfWork uow)
    : IRequestHandler<PublicarBlogPostCommand, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(PublicarBlogPostCommand request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetByIdComCategoriaAsync(request.Id, ct);
        if (post is null)
            throw new NotFoundException("BlogPost", request.Id);

        post.Status = "Publicado";
        if (post.DataPublicacao is null || post.DataPublicacao > DateTime.UtcNow)
            post.DataPublicacao = DateTime.UtcNow;

        uow.BlogPosts.Update(post);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
