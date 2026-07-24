using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.BloquearContador;

public sealed class BloquearContadorCommandHandler(IUnitOfWork uow)
    : IRequestHandler<BloquearContadorCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(BloquearContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null) return Result.Failure<bool>(ResultError.NotFound("Contador não encontrado."));

        contador.StatusLicenca = StatusLicencaEnum.Bloqueado;
        contador.MotivoBloqueio = request.Motivo;
        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);
        return Result.Success(true);
    }
}
