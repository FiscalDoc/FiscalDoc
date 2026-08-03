using MediatR;
using VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetNfeEmissao;

public sealed class GetNfeEmissaoQueryHandler(IUnitOfWork uow) : IRequestHandler<GetNfeEmissaoQuery, Result<NfeEmissaoDto?>>
{
    public async Task<Result<NfeEmissaoDto?>> Handle(GetNfeEmissaoQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        var emissao = await uow.NfeEmissoes.GetLatestByPedidoAsync(request.PedidoId, ct);
        return Result.Success(emissao is null ? null : EmitirNfeFocusCommandHandler.ToDto(emissao));
    }
}
