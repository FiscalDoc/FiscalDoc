using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberById;

public sealed class GetContaReceberByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetContaReceberByIdQuery, Result<ContaReceberDto>>
{
    public async Task<Result<ContaReceberDto>> Handle(GetContaReceberByIdQuery request, CancellationToken ct)
    {
        var conta = await uow.ContasReceber.GetByIdAsync(request.Id, ct);
        if (conta is null || conta.ClienteId != request.ClienteId)
            return Result.Failure<ContaReceberDto>(ResultError.NotFound("Conta a receber"));

        var destinatario = await uow.Destinatarios.GetByIdAsync(conta.DestinatarioId, ct);
        var pedido = conta.PedidoId.HasValue ? await uow.Pedidos.GetByIdAsync(conta.PedidoId.Value, ct) : null;

        return Result.Success(CreateContaReceberCommandHandler.ToDto(conta, destinatario?.RazaoSocial ?? "", pedido?.Numero));
    }
}
