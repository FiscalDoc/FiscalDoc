using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetPublicBlogPostBySlug;

public sealed class GetPublicBlogPostBySlugQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPublicBlogPostBySlugQuery, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(GetPublicBlogPostBySlugQuery request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetBySlugPublicoAsync(request.Slug, ct);
        if (post is null)
            return Result.Failure<BlogPostDto>(ResultError.NotFound("BlogPost"));

        post.Visualizacoes++;
        uow.BlogPosts.Update(post);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
