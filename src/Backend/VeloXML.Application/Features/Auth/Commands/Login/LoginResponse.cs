namespace VeloXML.Application.Features.Auth.Commands.Login;

public record LoginResponse(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    string Nome,
    string Email,
    string Perfil,
    Guid TenantId,
    string Plano,
    DateTime? PlanoExpiracao,
    bool RequiresTwoFactor = false,
    string? TwoFactorToken = null
);
