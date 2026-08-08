using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Commands.DeleteTransportadora;

public sealed class DeleteTransportadoraCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteTransportadoraCommand, Result>
{
    public async Task<Result> Handle(DeleteTransportadoraCommand request, CancellationToken ct)
    {
        var transportadora = await uow.Transportadoras.GetByIdAsync(request.Id, ct);
        if (transportadora is null || transportadora.ClienteId != request.ClienteId)
            throw new NotFoundException("Transportadora", request.Id);

        // Pedido.TransportadoraId é SetNull (diferente de Produto/Destinatario, que são Restrict)
        // — excluir uma transportadora usada em pedidos antigos é seguro, eles só perdem a
        // referência em vez de travar a exclusão.
        uow.Transportadoras.Remove(transportadora);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
