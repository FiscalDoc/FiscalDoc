using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogPosts;

public record GetBlogPostsQuery(
    string? Termo,
    string? Status,
    Guid? CategoriaId,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<BlogPostDto>>>;
