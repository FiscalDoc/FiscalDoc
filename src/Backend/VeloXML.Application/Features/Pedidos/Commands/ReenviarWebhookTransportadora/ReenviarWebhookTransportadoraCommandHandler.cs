using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ReenviarWebhookTransportadora;

public sealed class ReenviarWebhookTransportadoraCommandHandler(IUnitOfWork uow, IBackgroundJobDispatcher jobs)
    : IRequestHandler<ReenviarWebhookTransportadoraCommand, Result>
{
    public async Task<Result> Handle(ReenviarWebhookTransportadoraCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        if (pedido.TransportadoraId is null)
            throw new DomainException("PEDIDO_SEM_TRANSPORTADORA", "Pedido não tem transportadora vinculada.");

        jobs.EnqueueTransportadoraWebhook(pedido.Id);
        return Result.Success();
    }
}
