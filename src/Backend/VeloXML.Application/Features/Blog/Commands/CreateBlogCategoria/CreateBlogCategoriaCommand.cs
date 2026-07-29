using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.CreateBlogCategoria;

public record CreateBlogCategoriaCommand(string Nome, string? Slug) : IRequest<Result<BlogCategoriaDto>>;
