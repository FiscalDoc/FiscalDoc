using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.DeleteContaReceber;

public sealed class DeleteContaReceberCommandHandler(IUnitOfWork uow)
    : IRequestHandler<DeleteContaReceberCommand, Result>
{
    public async Task<Result> Handle(DeleteContaReceberCommand request, CancellationToken ct)
    {
        var conta = await uow.ContasReceber.GetByIdAsync(request.Id, ct);
        if (conta is null || conta.ClienteId != request.ClienteId)
            throw new NotFoundException("Conta a receber", request.Id);

        uow.ContasReceber.Remove(conta);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
