using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.DeleteDestinatario;

public sealed class DeleteDestinatarioCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteDestinatarioCommand, Result>
{
    public async Task<Result> Handle(DeleteDestinatarioCommand request, CancellationToken ct)
    {
        var dest = await uow.Destinatarios.GetByIdAsync(request.Id, ct);
        if (dest is null || dest.ClienteId != request.ClienteId)
            throw new NotFoundException("Destinatario", request.Id);

        uow.Destinatarios.Remove(dest);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
