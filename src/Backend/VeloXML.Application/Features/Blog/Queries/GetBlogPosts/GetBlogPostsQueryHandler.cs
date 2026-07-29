using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogPosts;

public sealed class GetBlogPostsQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetBlogPostsQuery, Result<PagedResult<BlogPostDto>>>
{
    public async Task<Result<PagedResult<BlogPostDto>>> Handle(GetBlogPostsQuery request, CancellationToken ct)
    {
        var paged = await uow.BlogPosts.SearchAdminAsync(
            request.Termo, request.Status, request.CategoriaId, request.Page, request.PageSize, ct);

        var dto = PagedResult<BlogPostDto>.Create(
            paged.Items.Select(BlogDtoMapper.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
