using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.CreateBlogCategoria;

public sealed class CreateBlogCategoriaCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateBlogCategoriaCommand, Result<BlogCategoriaDto>>
{
    public async Task<Result<BlogCategoriaDto>> Handle(CreateBlogCategoriaCommand request, CancellationToken ct)
    {
        var slug = await BlogSlugResolver.ResolverCategoriaAsync(uow, request.Nome, request.Slug, null, ct);

        var categoria = new BlogCategoria { Nome = request.Nome, Slug = slug };

        await uow.BlogCategorias.AddAsync(categoria, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(categoria));
    }
}
