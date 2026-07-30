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
