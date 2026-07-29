using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DeleteBlogPost;

public record DeleteBlogPostCommand(Guid Id) : IRequest<Result>;
