using MediatR;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPreviewImpostos;

// Prévia dos impostos ANTES de emitir — botão "Recalcular Impostos" na tela do pedido. Usa o
// mesmo cálculo (base × alíquota, mesma regra de DIFAL) que o FocusNfePayloadBuilder manda pra
// Focus computar de verdade na hora de emitir, só que rodado aqui localmente pra mostrar o
// resultado em dinheiro sem gastar uma tentativa de emissão real.
public sealed class GetPreviewImpostosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPreviewImpostosQuery, Result<DocumentoImpostosDto>>
{
    public async Task<Result<DocumentoImpostosDto>> Handle(GetPreviewImpostosQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);
        if (pedido.Destinatario is null)
            return Result.Failure<DocumentoImpostosDto>(ResultError.Validation("Destinatario", "Pedido sem destinatário."));
        if (pedido.Itens.Count == 0)
            return Result.Failure<DocumentoImpostosDto>(ResultError.Validation("Itens", "Adicione pelo menos um item pra calcular os impostos."));

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<DocumentoImpostosDto>(ResultError.NotFound("Cliente"));

        return Result.Success(ImpostosPreviewCalculator.Calcular(cliente, pedido));
    }
}
