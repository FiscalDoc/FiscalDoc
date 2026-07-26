using MediatR;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateClienteFiscal;

public sealed class UpdateClienteFiscalCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateClienteFiscalCommand, Result>
{
    public async Task<Result> Handle(UpdateClienteFiscalCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct)
            ?? throw new NotFoundException("Cliente", request.ClienteId);

        cliente.RegimeTributario = request.RegimeTributario;
        cliente.InscricaoEstadual = request.InscricaoEstadual;
        cliente.InscricaoMunicipal = request.InscricaoMunicipal;
        cliente.CnaePrincipal = request.CnaePrincipal;
        cliente.SerieNfe = request.SerieNfe;
        cliente.NfeHabilitado = request.NfeHabilitado;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
