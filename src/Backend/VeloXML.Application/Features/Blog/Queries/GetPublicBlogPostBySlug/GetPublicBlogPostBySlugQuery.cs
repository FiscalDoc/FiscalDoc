using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetPublicBlogPostBySlug;

public record GetPublicBlogPostBySlugQuery(string Slug) : IRequest<Result<BlogPostDto>>;
