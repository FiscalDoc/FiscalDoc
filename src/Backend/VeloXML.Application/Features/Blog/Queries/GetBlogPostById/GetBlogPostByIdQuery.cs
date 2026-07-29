using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogPostById;

public record GetBlogPostByIdQuery(Guid Id) : IRequest<Result<BlogPostDto>>;
