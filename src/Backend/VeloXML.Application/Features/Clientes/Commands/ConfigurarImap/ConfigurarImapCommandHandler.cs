using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Clientes.Queries.GetClientes;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.ConfigurarImap;

public sealed class ConfigurarImapCommandHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<ConfigurarImapCommand, Result<ClienteDto>>
{
    public async Task<Result<ClienteDto>> Handle(ConfigurarImapCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<ClienteDto>(ResultError.NotFound("Cliente não encontrado."));

        cliente.ImapHabilitado = request.Habilitado;
        cliente.ImapHost       = request.Host;
        cliente.ImapPort       = request.Port > 0 ? request.Port : 993;
        cliente.ImapEmail      = request.Email;

        // Only overwrite the stored password when a new one is provided.
        if (!string.IsNullOrWhiteSpace(request.Senha))
            cliente.ImapSenha = request.Senha;

        uow.Clientes.Update(cliente);
        await uow.SaveChangesAsync(ct);

        return Result.Success(mapper.Map<ClienteDto>(cliente));
    }
}
