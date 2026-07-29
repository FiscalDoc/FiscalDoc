using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Blog.Commands.DeleteBlogCategoria;

public sealed class DeleteBlogCategoriaCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteBlogCategoriaCommand, Result>
{
    public async Task<Result> Handle(DeleteBlogCategoriaCommand request, CancellationToken ct)
    {
        var categoria = await uow.BlogCategorias.GetByIdAsync(request.Id, ct);
        if (categoria is null)
            throw new NotFoundException("BlogCategoria", request.Id);

        uow.BlogCategorias.Remove(categoria);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
