using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DeleteBlogCategoria;

public record DeleteBlogCategoriaCommand(Guid Id) : IRequest<Result>;
