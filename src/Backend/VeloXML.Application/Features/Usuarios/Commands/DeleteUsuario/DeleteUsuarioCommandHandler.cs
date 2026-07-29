using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.DeleteUsuario;

public sealed class DeleteUsuarioCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ILogger<DeleteUsuarioCommandHandler> logger)
    : IRequestHandler<DeleteUsuarioCommand, Result>
{
    public async Task<Result> Handle(DeleteUsuarioCommand request, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(request.Id, ct);
        if (user is null)
            return Result.Failure(ResultError.NotFound("Usuário"));

        if (user.Id == currentUser.UserId)
            return Result.Failure(ResultError.Validation("Usuario", "Você não pode excluir seu próprio usuário."));

        if (user.Perfil == PerfilEnum.Administrador)
        {
            var admins = await uow.Users.FindAsync(u => u.Perfil == PerfilEnum.Administrador, ct);
            if (admins.Count <= 1)
                return Result.Failure(ResultError.Validation("Usuario", "Não é possível excluir o único administrador do sistema."));
        }

        uow.Users.Remove(user);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("Usuário {UserId} ({Email}) excluído por {AdminId}", user.Id, user.Email, currentUser.UserId);

        return Result.Success();
    }
}
