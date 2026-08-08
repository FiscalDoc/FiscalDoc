using VeloXML.Domain.Entities;

namespace VeloXML.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, string? empresa = null, string? cnpj = null);

    // Token de "atuar como" (impersonação): sub continua sendo o Administrador real (auditoria/
    // change-password etc. continuam batendo com a conta real), mas role/tenant/contador/
    // cliente refletem o contexto escolhido. acting_admin_id marca a sessão como impersonada.
    string GenerateContextToken(User admin, string perfil, Guid tenantId, Guid? contadorId, Guid? clienteId, string? empresa, string? cnpj = null);

    string GenerateRefreshToken();
    Guid? GetUserIdFromExpiredToken(string token);
    string GenerateTwoFactorToken(Guid userId, Guid tenantId);
    Guid? GetUserIdFromTwoFactorToken(string token);
}
