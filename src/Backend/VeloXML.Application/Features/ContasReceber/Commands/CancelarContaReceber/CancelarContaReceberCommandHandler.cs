using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.CancelarContaReceber;

public sealed class CancelarContaReceberCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CancelarContaReceberCommand, Result>
{
    public async Task<Result> Handle(CancelarContaReceberCommand request, CancellationToken ct)
    {
        var conta = await uow.ContasReceber.GetByIdAsync(request.Id, ct);
        if (conta is null || conta.ClienteId != request.ClienteId)
            throw new NotFoundException("Conta a receber", request.Id);

        if (conta.Status != StatusContaReceberEnum.Pendente)
            return Result.Failure(ResultError.Validation("Status", "Só é possível cancelar contas pendentes."));

        conta.Status = StatusContaReceberEnum.Cancelado;
        uow.ContasReceber.Update(conta);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
