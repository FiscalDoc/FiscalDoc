using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth.Commands.Login;
using VeloXML.Application.Features.Auth.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.RefreshToken;

public sealed class RefreshTokenCommandHandler(
    IUnitOfWork uow,
    ITokenService tokenService,
    IApplicationDbContext db) : IRequestHandler<RefreshTokenCommand, Result<LoginResponse>>
{
    public async Task<Result<LoginResponse>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var userId = tokenService.GetUserIdFromExpiredToken(request.AccessToken);
        if (userId is null)
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("Token inválido."));

        var user = await uow.Users.GetWithRefreshTokensAsync(userId.Value, ct);
        if (user is null)
            return Result.Failure<LoginResponse>(ResultError.NotFound("User"));

        var storedToken = user.RefreshTokens.FirstOrDefault(t => t.Token == request.RefreshToken);
        if (storedToken is null || !storedToken.IsActive)
            return Result.Failure<LoginResponse>(ResultError.Unauthorized("Refresh token inválido ou expirado."));

        var newRefreshTokenValue = tokenService.GenerateRefreshToken();
        storedToken.RevokedAt = DateTime.UtcNow;
        storedToken.ReplacedByToken = newRefreshTokenValue;
        storedToken.RevokedReason = "Replaced by new token";

        user.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            UserId = user.Id,
            TenantId = user.TenantId,
            Token = newRefreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await uow.SaveChangesAsync(ct);

        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, ct);

        // Sem isso, o refresh silencioso (a cada ~60min) apagava "empresa"/"cnpj" do token —
        // o rodapé da sidebar perdia o nome da empresa até o próximo login manual.
        var (empresa, cnpj) = await EmpresaClaimHelper.ResolverAsync(uow, user, ct);

        return Result.Success(new LoginResponse(
            AccessToken: tokenService.GenerateAccessToken(user, empresa, cnpj),
            RefreshToken: newRefreshTokenValue,
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
