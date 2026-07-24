using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.AtualizarPlanoContador;

public sealed class AtualizarPlanoContadorCommandHandler(IUnitOfWork uow)
    : IRequestHandler<AtualizarPlanoContadorCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(AtualizarPlanoContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null) return Result.Failure<bool>(ResultError.NotFound("Contador não encontrado."));

        contador.ValorPorCliente    = request.ValorPorCliente;
        contador.LimiteXmlPorCliente = request.LimiteXmlPorCliente;
        contador.ValorXmlExcedente  = request.ValorXmlExcedente;
        uow.Contadores.Update(contador);
        await uow.SaveChangesAsync(ct);
        return Result.Success(true);
    }
}
