using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ReenviarEmailNfe;

public sealed class ReenviarEmailNfeCommandHandler(IUnitOfWork uow, IBackgroundJobDispatcher jobs)
    : IRequestHandler<ReenviarEmailNfeCommand, Result>
{
    public async Task<Result> Handle(ReenviarEmailNfeCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        var cliente = await uow.Clientes.GetByIdAsync(pedido.ClienteId, ct);
        if (cliente is null || !cliente.EmailNfeDestinatarioHabilitado)
            throw new DomainException("EMAIL_NFE_DESATIVADO", "Envio automático de e-mail da NF-e não está ativado para este cliente.");

        jobs.EnqueueEmailNfeDestinatario(pedido.Id);
        return Result.Success();
    }
}
