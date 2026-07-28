using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.EmitirPedido;

public sealed class EmitirPedidoCommandHandler(IUnitOfWork uow, ILogger<EmitirPedidoCommandHandler> logger)
    : IRequestHandler<EmitirPedidoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(EmitirPedidoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.Id, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.Id);

        if (pedido.Status != "Rascunho")
            return Result.Failure<PedidoDto>(ResultError.Validation("Status", "Apenas pedidos em rascunho podem ser emitidos."));

        if (pedido.Itens.Count == 0)
            return Result.Failure<PedidoDto>(ResultError.Validation("Itens", "Adicione pelo menos um item antes de emitir o pedido."));

        pedido.Status = "Emitido";
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Pedido {PedidoId} (nº {Numero}) emitido", pedido.Id, pedido.Numero);

        return Result.Success(CreatePedidoCommandHandler.ToDto(pedido));
    }
}
