using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Alertas.Commands.MarcarAlertaLido;

public sealed class MarcarAlertaLidoCommandHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<MarcarAlertaLidoCommand, Result>
{
    public async Task<Result> Handle(MarcarAlertaLidoCommand request, CancellationToken ct)
    {
        var alerta = await uow.Alertas.GetByIdAsync(request.AlertaId, ct);
        if (alerta is null)
            return Result.Failure(ResultError.NotFound("Alerta"));

        alerta.Status = StatusAlertaEnum.Lido;
        alerta.LidoEm = DateTime.UtcNow;
        alerta.LidoPor = currentUser.Email;
        alerta.UpdatedAt = DateTime.UtcNow;

        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
