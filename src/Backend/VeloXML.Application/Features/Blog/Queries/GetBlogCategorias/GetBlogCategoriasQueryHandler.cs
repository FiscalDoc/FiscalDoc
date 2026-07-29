using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Queries.GetBlogCategorias;

public sealed class GetBlogCategoriasQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetBlogCategoriasQuery, Result<List<BlogCategoriaDto>>>
{
    public async Task<Result<List<BlogCategoriaDto>>> Handle(GetBlogCategoriasQuery request, CancellationToken ct)
    {
        var categorias = await uow.BlogCategorias.GetAllOrderedAsync(ct);
        return Result.Success(categorias.Select(BlogDtoMapper.ToDto).ToList());
    }
}
