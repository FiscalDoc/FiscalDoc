using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.DeleteClienteUsuario;

public sealed class DeleteClienteUsuarioCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ILogger<DeleteClienteUsuarioCommandHandler> logger)
    : IRequestHandler<DeleteClienteUsuarioCommand, Result>
{
    public async Task<Result> Handle(DeleteClienteUsuarioCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure(ResultError.Unauthorized("Você não tem permissão para excluir usuários deste cliente."));

        var alvo = await uow.Users.GetByIdAsync(request.Id, ct);
        if (alvo is null || alvo.ClienteId != request.ClienteId)
        {
            logger.LogWarning("Tentativa de excluir usuário {UserId} fora do escopo do cliente {ClienteId}", request.Id, request.ClienteId);
            return Result.Failure(ResultError.NotFound("Usuário"));
        }

        uow.Users.Remove(alvo);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Usuário {UserId} excluído do cliente {ClienteId}", request.Id, request.ClienteId);

        return Result.Success();
    }
}
