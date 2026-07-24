using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.SetDataLimiteAcesso;

public sealed class SetDataLimiteAcessoCommandHandler(IUnitOfWork uow)
    : IRequestHandler<SetDataLimiteAcessoCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(SetDataLimiteAcessoCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null) return Result.Failure<bool>(ResultError.NotFound("Contador não encontrado."));

        // PostgreSQL timestamp with time zone exige Kind=Utc
        contador.DataLimiteAcesso = request.DataLimite.HasValue
            ? DateTime.SpecifyKind(request.DataLimite.Value, DateTimeKind.Utc)
            : null;
        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);
        return Result.Success(true);
    }
}
