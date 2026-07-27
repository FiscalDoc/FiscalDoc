using AutoMapper;
using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateClienteFiscal;

public sealed class UpdateClienteFiscalCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, IMapper mapper, ILogger<UpdateClienteFiscalCommandHandler> logger)
    : IRequestHandler<UpdateClienteFiscalCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(UpdateClienteFiscalCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct)
            ?? throw new NotFoundException("Cliente", request.ClienteId);

        // Somente Admin pode habilitar/desabilitar emissão de NF-e: se outro perfil tentar mudar
        // o valor atual, rejeitamos explicitamente em vez de salvar o resto e ignorar esse campo.
        if (request.NfeHabilitado != cliente.NfeHabilitado && currentUser.Role != "Administrador")
        {
            logger.LogWarning(
                "Usuário {Role} tentou alterar NfeHabilitado do cliente {ClienteId} sem permissão", currentUser.Role, request.ClienteId);
            return Result.Failure<ClienteDto>(
                ResultError.Unauthorized("Apenas o administrador pode alterar a emissão de NF-e."));
        }

        cliente.RegimeTributario = request.RegimeTributario;
        cliente.InscricaoEstadual = request.InscricaoEstadual;
        cliente.InscricaoMunicipal = request.InscricaoMunicipal;
        cliente.CnaePrincipal = request.CnaePrincipal;
        cliente.SerieNfe = request.SerieNfe;
        cliente.NfeHabilitado = request.NfeHabilitado;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
