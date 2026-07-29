using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.PublicarBlogPost;

public record PublicarBlogPostCommand(Guid Id) : IRequest<Result<BlogPostDto>>;
