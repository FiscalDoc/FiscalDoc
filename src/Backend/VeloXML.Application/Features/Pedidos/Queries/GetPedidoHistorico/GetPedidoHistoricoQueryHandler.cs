using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidoHistorico;

public sealed class GetPedidoHistoricoQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetPedidoHistoricoQuery, Result<List<PedidoHistoricoDto>>>
{
    public async Task<Result<List<PedidoHistoricoDto>>> Handle(GetPedidoHistoricoQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            return Result.Failure<List<PedidoHistoricoDto>>(ResultError.NotFound("Pedido"));

        var historico = await uow.PedidoHistoricos.GetByPedidoAsync(request.PedidoId, ct);
        return Result.Success(historico
            .Select(h => new PedidoHistoricoDto(h.Id, h.Tipo, h.Descricao, h.UsuarioNome, h.CreatedAt))
            .ToList());
    }
}
