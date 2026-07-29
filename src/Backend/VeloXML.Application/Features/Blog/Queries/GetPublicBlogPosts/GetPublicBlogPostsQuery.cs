using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetPublicBlogPosts;

public record GetPublicBlogPostsQuery(
    string? Termo,
    string? CategoriaSlug,
    int Page = 1,
    int PageSize = 12
) : IRequest<Result<PagedResult<BlogPostResumoDto>>>;
