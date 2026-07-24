using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.LiberarContador;

public sealed class LiberarContadorCommandHandler(IUnitOfWork uow)
    : IRequestHandler<LiberarContadorCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(LiberarContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null) return Result.Failure<bool>(ResultError.NotFound("Contador não encontrado."));

        contador.StatusLicenca = StatusLicencaEnum.Ativo;
        contador.MotivoBloqueio = null;
        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);
        return Result.Success(true);
    }
}
