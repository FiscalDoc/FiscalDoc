using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;
using RefreshTokenEntity = VeloXML.Domain.Entities.RefreshToken;

namespace VeloXML.Application.Features.Auth.Commands.Verify2fa;

public sealed class Verify2faCommandHandler(
    IUnitOfWork uow,
    ITokenService tokenService,
    ITotpService totp,
    IApplicationDbContext db) : IRequestHandler<Verify2faCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(Verify2faCommand request, CancellationToken ct)
    {
        var userId = tokenService.GetUserIdFromTwoFactorToken(request.TwoFactorToken);
        if (userId is null)
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("Token de 2FA inválido ou expirado."));

        var user = await uow.Users.GetByIdAsync(userId.Value, ct);
        if (user is null || !user.TwoFactorHabilitado || string.IsNullOrEmpty(user.TotpSecret))
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("2FA não configurado."));

        if (!totp.ValidateCode(user.TotpSecret, request.Code))
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("Código inválido ou expirado."));

        string? empresa = null;
        if (user.ContadorId.HasValue)
        {
            var contador = await uow.Contadores.GetByIdAsync(user.ContadorId.Value, ct);
            empresa = contador?.Empresa ?? contador?.Nome;
        }

        var accessToken    = tokenService.GenerateAccessToken(user, empresa);
        var refreshTokenValue = tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshTokenEntity
        {
            UserId    = user.Id,
            TenantId  = user.TenantId,
            Token     = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        await uow.Tokens.AddAsync(refreshToken, ct);
        await uow.SaveChangesAsync(ct);

        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, ct);

        return Result.Success(new LoginResponse(
            AccessToken: accessToken,
            RefreshToken: refreshTokenValue,
            ExpiresAt: DateTime.UtcNow.AddMinutes(60),
            Nome: user.Nome,
            Email: user.Email,
            Perfil: user.Perfil.ToString(),
            TenantId: user.TenantId,
            Plano: tenant?.Plano ?? "Starter",
            PlanoExpiracao: tenant?.PlanoExpiracao
        ));
    }
}
