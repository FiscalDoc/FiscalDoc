using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogPostById;

public sealed class GetBlogPostByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetBlogPostByIdQuery, Result<BlogPostDto>>
{
    public async Task<Result<BlogPostDto>> Handle(GetBlogPostByIdQuery request, CancellationToken ct)
    {
        var post = await uow.BlogPosts.GetByIdComCategoriaAsync(request.Id, ct);
        if (post is null)
            throw new NotFoundException("BlogPost", request.Id);

        return Result.Success(BlogDtoMapper.ToDto(post));
    }
}
