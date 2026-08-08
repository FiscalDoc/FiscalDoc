using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.CreatePedido;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.VincularDocumento;

public sealed class VincularDocumentoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, PedidoNotificationDispatcher notificationDispatcher)
    : IRequestHandler<VincularDocumentoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(VincularDocumentoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        var documento = await uow.Documentos.GetByIdAsync(request.DocumentoId, ct);
        if (documento is null || documento.ClienteId != request.ClienteId)
            return Result.Failure<PedidoDto>(ResultError.Validation(
                "DocumentoId", "Documento não encontrado ou não pertence a este cliente."));

        PedidoEmissaoHelper.VincularDocumentoAutorizado(pedido, documento);

        await uow.PedidoHistoricos.AddAsync(PedidoHistoricoHelper.Criar(
            pedido.Id, pedido.TenantId, "VinculoNfe", $"NF-e nº {documento.Numero} vinculada", currentUser), ct);
        await uow.SaveChangesAsync(ct);

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is not null)
            notificationDispatcher.AoEmitir(pedido, cliente, temDocumentoComXml: true);

        var atualizado = await uow.Pedidos.GetWithItensAsync(pedido.Id, ct);
        return Result.Success(CreatePedidoCommandHandler.ToDto(atualizado!));
    }
}

public sealed class DesvincularDocumentoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<DesvincularDocumentoCommand, Result<PedidoDto>>
{
    public async Task<Result<PedidoDto>> Handle(DesvincularDocumentoCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        pedido.DocumentoId = null;
        await uow.PedidoHistoricos.AddAsync(PedidoHistoricoHelper.Criar(
            pedido.Id, pedido.TenantId, "DesvinculoNfe", "NF-e desvinculada", currentUser), ct);
        await uow.SaveChangesAsync(ct);

        var atualizado = await uow.Pedidos.GetWithItensAsync(pedido.Id, ct);
        return Result.Success(CreatePedidoCommandHandler.ToDto(atualizado!));
    }
}
