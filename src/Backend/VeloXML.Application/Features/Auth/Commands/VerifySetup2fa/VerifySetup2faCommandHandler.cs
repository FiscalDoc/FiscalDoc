using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.VerifySetup2fa;

public sealed class VerifySetup2faCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ITotpService totp)
    : IRequestHandler<VerifySetup2faCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(VerifySetup2faCommand request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Result.Failure<bool>(ResultError.Unauthorized("Não autenticado."));

        var user = await uow.Users.GetByIdAsync(currentUser.UserId.Value, ct);
        if (user is null || string.IsNullOrEmpty(user.TotpSecret))
            return Result.Failure<bool>(ResultError.BadRequest("Setup de 2FA não iniciado. Chame /auth/2fa/setup primeiro."));

        if (!totp.ValidateCode(user.TotpSecret, request.Code))
            return Result.Failure<bool>(ResultError.BadRequest("Código inválido ou expirado."));

        user.TwoFactorHabilitado = true;
        await uow.SaveChangesAsync(ct);

        return Result.Success(true);
    }
}
