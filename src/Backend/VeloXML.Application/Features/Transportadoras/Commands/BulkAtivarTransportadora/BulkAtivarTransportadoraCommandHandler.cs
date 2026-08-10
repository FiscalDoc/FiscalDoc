using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.BulkAtivarTransportadora;

public sealed class BulkAtivarTransportadoraCommandHandler(IUnitOfWork uow)
    : IRequestHandler<BulkAtivarTransportadoraCommand, Result>
{
    public async Task<Result> Handle(BulkAtivarTransportadoraCommand request, CancellationToken ct)
    {
        var transportadoras = await uow.Transportadoras.FindAsync(t => t.ClienteId == request.ClienteId && request.Ids.Contains(t.Id), ct);
        foreach (var transportadora in transportadoras)
        {
            transportadora.Ativo = request.Ativo;
            uow.Transportadoras.Update(transportadora);
        }

        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
