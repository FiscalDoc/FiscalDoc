using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.UpdateBlogCategoria;

public sealed class UpdateBlogCategoriaCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateBlogCategoriaCommand, Result<BlogCategoriaDto>>
{
    public async Task<Result<BlogCategoriaDto>> Handle(UpdateBlogCategoriaCommand request, CancellationToken ct)
    {
        var categoria = await uow.BlogCategorias.GetByIdAsync(request.Id, ct);
        if (categoria is null)
            throw new NotFoundException("BlogCategoria", request.Id);

        var slug = await BlogSlugResolver.ResolverCategoriaAsync(uow, request.Nome, request.Slug, request.Id, ct);

        categoria.Nome = request.Nome;
        categoria.Slug = slug;

        uow.BlogCategorias.Update(categoria);
        await uow.SaveChangesAsync(ct);

        return Result.Success(BlogDtoMapper.ToDto(categoria));
    }
}
