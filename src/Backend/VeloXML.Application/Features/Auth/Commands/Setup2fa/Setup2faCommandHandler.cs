using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Setup2fa;

public sealed class Setup2faCommandHandler(IUnitOfWork uow, ICurrentUser currentUser, ITotpService totp)
    : IRequestHandler<Setup2faCommand, Result<Setup2faResponse>>
{
    public async Task<Result<Setup2faResponse>> Handle(Setup2faCommand request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is null)
            return Result.Failure<Setup2faResponse>(ResultError.Unauthorized("Não autenticado."));

        var user = await uow.Users.GetByIdAsync(currentUser.UserId.Value, ct);
        if (user is null)
            return Result.Failure<Setup2faResponse>(ResultError.NotFound("Usuário não encontrado."));

        var secret = totp.GenerateSecret();
        user.TotpSecret = secret;
        await uow.SaveChangesAsync(ct);

        var uri = totp.GetOtpAuthUri(secret, user.Email);
        return Result.Success(new Setup2faResponse(secret, uri));
    }
}
