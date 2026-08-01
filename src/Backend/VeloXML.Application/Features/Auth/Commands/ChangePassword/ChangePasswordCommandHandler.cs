using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.ChangePassword;

public sealed class ChangePasswordCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ILogger<ChangePasswordCommandHandler> logger)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public async Task<Result> Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        if (currentUser.UserId is null)
            return Result.Failure(ResultError.Unauthorized());

        // Numa sessão impersonada, currentUser.UserId ainda é o Administrador real por trás do
        // "atuar como" — bloqueado de propósito pra não alterar a senha do admin achando que
        // está mexendo na conta do Contador/Cliente que está sendo visualizado.
        if (currentUser.ActingAdminId is not null)
            return Result.Failure(ResultError.Validation("Contexto", "Volte para o seu usuário administrador antes de alterar a senha."));

        var user = await uow.Users.GetByIdAsync(currentUser.UserId.Value, ct);
        if (user is null)
            return Result.Failure(ResultError.Unauthorized());

        if (!BCrypt.Net.BCrypt.Verify(request.SenhaAtual, user.PasswordHash))
            return Result.Failure(ResultError.Validation("SenhaAtual", "Senha atual incorreta."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        uow.Users.Update(user);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("Usuário {UserId} alterou a própria senha.", user.Id);

        return Result.Success();
    }
}
