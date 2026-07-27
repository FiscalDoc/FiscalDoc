using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Usuarios.Commands.UpdateUsuario;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.UpdateClienteUsuario;

public sealed class UpdateClienteUsuarioCommandHandler(
    IMediator mediator, IUnitOfWork uow, ICurrentUser currentUser, ILogger<UpdateClienteUsuarioCommandHandler> logger)
    : IRequestHandler<UpdateClienteUsuarioCommand, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(UpdateClienteUsuarioCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<UsuarioDto>(ResultError.Unauthorized("Você não tem permissão para alterar usuários deste cliente."));

        var alvo = await uow.Users.GetByIdAsync(request.Id, ct);
        if (alvo is null || alvo.ClienteId != request.ClienteId)
        {
            logger.LogWarning("Tentativa de alterar usuário {UserId} fora do escopo do cliente {ClienteId}", request.Id, request.ClienteId);
            return Result.Failure<UsuarioDto>(ResultError.NotFound("Usuário"));
        }

        return await mediator.Send(new UpdateUsuarioCommand(request.Id, request.Nome, request.Ativo, request.NovaSenha), ct);
    }
}
