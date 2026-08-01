using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(IUnitOfWork uow) : IRequestHandler<ResetPasswordCommand, Result>
{
    public async Task<Result> Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var token = await uow.PasswordResetTokens.GetByTokenAsync(request.Token, ct);
        if (token is null || !token.IsActive)
            return Result.Failure(ResultError.Validation("Token", "Link inválido ou expirado. Solicite um novo."));

        var user = await uow.Users.GetByIdAsync(token.UserId, ct);
        if (user is null)
            return Result.Failure(ResultError.Validation("Token", "Link inválido ou expirado. Solicite um novo."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        user.SenhaDefinida = true;
        uow.Users.Update(user);

        token.UsedAt = DateTime.UtcNow;
        uow.PasswordResetTokens.Update(token);

        await uow.SaveChangesAsync(ct);
        return Result.Success();
    }
}
