using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.DarBaixaContaReceber;

public sealed class DarBaixaContaReceberCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DarBaixaContaReceberCommand, Result<ContaReceberDto>>
{
    public async Task<Result<ContaReceberDto>> Handle(DarBaixaContaReceberCommand request, CancellationToken ct)
    {
        var conta = await uow.ContasReceber.GetByIdAsync(request.Id, ct);
        if (conta is null || conta.ClienteId != request.ClienteId)
            throw new NotFoundException("Conta a receber", request.Id);

        if (conta.Status != StatusContaReceberEnum.Pendente)
            return Result.Failure<ContaReceberDto>(ResultError.Validation("Status", "Só é possível dar baixa em contas pendentes."));

        conta.Status = StatusContaReceberEnum.Pago;
        conta.DataPagamento = (request.DataPagamento ?? DateTime.UtcNow).Date;
        conta.FormaPagamento = request.FormaPagamento;

        uow.ContasReceber.Update(conta);
        await uow.SaveChangesAsync(ct);

        var destinatario = await uow.Destinatarios.GetByIdAsync(conta.DestinatarioId, ct);
        var pedido = conta.PedidoId.HasValue ? await uow.Pedidos.GetByIdAsync(conta.PedidoId.Value, ct) : null;
        return Result.Success(CreateContaReceberCommandHandler.ToDto(conta, destinatario?.RazaoSocial ?? "", pedido?.Numero));
    }
}
