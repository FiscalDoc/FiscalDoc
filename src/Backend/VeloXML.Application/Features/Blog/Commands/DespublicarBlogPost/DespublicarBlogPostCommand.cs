using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DespublicarBlogPost;

public record DespublicarBlogPostCommand(Guid Id) : IRequest<Result<BlogPostDto>>;
