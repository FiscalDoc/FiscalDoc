using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.UpdateBlogCategoria;

public record UpdateBlogCategoriaCommand(Guid Id, string Nome, string? Slug) : IRequest<Result<BlogCategoriaDto>>;
