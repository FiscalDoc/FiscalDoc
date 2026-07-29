using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetPublicBlogPosts;

public sealed class GetPublicBlogPostsQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPublicBlogPostsQuery, Result<PagedResult<BlogPostResumoDto>>>
{
    public async Task<Result<PagedResult<BlogPostResumoDto>>> Handle(GetPublicBlogPostsQuery request, CancellationToken ct)
    {
        var paged = await uow.BlogPosts.SearchPublicAsync(
            request.Termo, request.CategoriaSlug, request.Page, request.PageSize, ct);

        var dto = PagedResult<BlogPostResumoDto>.Create(
            paged.Items.Select(BlogDtoMapper.ToResumoDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
