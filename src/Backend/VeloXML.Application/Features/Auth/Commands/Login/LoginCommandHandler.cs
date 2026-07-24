using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;
using RefreshTokenEntity = VeloXML.Domain.Entities.RefreshToken;

namespace VeloXML.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IUnitOfWork uow,
    ITokenService tokenService,
    IApplicationDbContext db) : IRequestHandler<LoginCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await uow.Users.GetByEmailAsync(request.Email, ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("E-mail ou senha incorretos."));

        if (!user.Ativo)
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("Usuário inativo."));

        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, ct);

        string? empresa = null;
        if (user.ContadorId.HasValue)
        {
            var contador = await uow.Contadores.GetByIdAsync(user.ContadorId.Value, ct);
            empresa = contador?.Empresa ?? contador?.Nome;
        }

        if (user.TwoFactorHabilitado)
        {
            var twoFactorToken = tokenService.GenerateTwoFactorToken(user.Id, user.TenantId);
            return Result.Success(new LoginResponse(
                AccessToken: string.Empty,
                RefreshToken: string.Empty,
                ExpiresAt: DateTime.UtcNow,
                Nome: user.Nome,
                Email: user.Email,
                Perfil: user.Perfil.ToString(),
                TenantId: user.TenantId,
                Plano: tenant?.Plano ?? "Starter",
                PlanoExpiracao: tenant?.PlanoExpiracao,
                RequiresTwoFactor: true,
                TwoFactorToken: twoFactorToken
            ));
        }

        var accessToken = tokenService.GenerateAccessToken(user, empresa);
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
