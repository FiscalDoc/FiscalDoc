using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;
using RefreshTokenEntity = VeloXML.Domain.Entities.RefreshToken;

namespace VeloXML.Application.Features.Auth.Commands.RestoreAdminContext;

public sealed class RestoreAdminContextCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ITokenService tokenService, ILogger<RestoreAdminContextCommandHandler> logger)
    : IRequestHandler<RestoreAdminContextCommand, Result<RestoreAdminContextResponse>>
{
    public async Task<Result<RestoreAdminContextResponse>> Handle(RestoreAdminContextCommand request, CancellationToken ct)
    {
        if (currentUser.ActingAdminId is null)
            return Result.Failure<RestoreAdminContextResponse>(ResultError.Validation("Contexto", "Não há sessão de impersonação ativa."));

        var admin = await uow.Users.GetByIdAsync(currentUser.ActingAdminId.Value, ct);
        if (admin is null)
            return Result.Failure<RestoreAdminContextResponse>(ResultError.Unauthorized());

        var accessToken = tokenService.GenerateAccessToken(admin);
        var refreshTokenValue = tokenService.GenerateRefreshToken();

        await uow.Tokens.AddAsync(new RefreshTokenEntity
        {
            UserId = admin.Id,
            TenantId = admin.TenantId,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        }, ct);
        await uow.SaveChangesAsync(ct);

        logger.LogInformation("[SwitchContext] Admin {AdminId} ({AdminEmail}) voltou pro próprio contexto.", admin.Id, admin.Email);

        return Result.Success(new RestoreAdminContextResponse(accessToken, refreshTokenValue, DateTime.UtcNow.AddMinutes(60)));
    }
}
