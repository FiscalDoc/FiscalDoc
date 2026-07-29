using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogCategorias;

public record GetBlogCategoriasQuery : IRequest<Result<List<BlogCategoriaDto>>>;
