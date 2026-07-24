using VeloXML.Domain.Entities;

namespace VeloXML.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, string? empresa = null);
    string GenerateRefreshToken();
    Guid? GetUserIdFromExpiredToken(string token);
    string GenerateTwoFactorToken(Guid userId, Guid tenantId);
    Guid? GetUserIdFromTwoFactorToken(string token);
}
