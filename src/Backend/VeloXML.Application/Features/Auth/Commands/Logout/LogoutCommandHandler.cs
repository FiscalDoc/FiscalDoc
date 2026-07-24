using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Logout;

public sealed class LogoutCommandHandler(
    ICurrentUser currentUser,
    IUnitOfWork uow) : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand request, CancellationToken ct)
    {
        if (currentUser.UserId is null)
            return Result.Failure(ResultError.Unauthorized());

        var user = await uow.Users.GetWithRefreshTokensAsync(currentUser.UserId.Value, ct);
        if (user is null) return Result.Success();

        var token = user.RefreshTokens.FirstOrDefault(t => t.Token == request.RefreshToken && t.IsActive);
        if (token is not null)
        {
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedReason = "Logout";
            await uow.SaveChangesAsync(ct);
        }

        return Result.Success();
    }
}
