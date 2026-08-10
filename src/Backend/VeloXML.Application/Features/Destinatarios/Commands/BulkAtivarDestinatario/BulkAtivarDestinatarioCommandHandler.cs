using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Commands.BulkAtivarDestinatario;

public sealed class BulkAtivarDestinatarioCommandHandler(IUnitOfWork uow)
    : IRequestHandler<BulkAtivarDestinatarioCommand, Result>
{
    public async Task<Result> Handle(BulkAtivarDestinatarioCommand request, CancellationToken ct)
    {
        var destinatarios = await uow.Destinatarios.FindAsync(d => d.ClienteId == request.ClienteId && request.Ids.Contains(d.Id), ct);
        foreach (var destinatario in destinatarios)
        {
            destinatario.Ativo = request.Ativo;
            uow.Destinatarios.Update(destinatario);
        }

        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
