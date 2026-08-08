using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;

namespace VeloXML.Infrastructure.Auth;

public sealed class JwtTokenService(IOptions<JwtOptions> opts) : ITokenService
{
    private readonly JwtOptions _opts = opts.Value;

    public string GenerateAccessToken(User user, string? empresa = null, string? cnpj = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claimList = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new("name", user.Nome),
            new("role", user.Perfil.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (user.ContadorId.HasValue)
            claimList.Add(new Claim("contador_id", user.ContadorId.Value.ToString()));

        if (user.ClienteId.HasValue)
            claimList.Add(new Claim("cliente_id", user.ClienteId.Value.ToString()));

        if (!string.IsNullOrEmpty(empresa))
            claimList.Add(new Claim("empresa", empresa));

        if (!string.IsNullOrEmpty(cnpj))
            claimList.Add(new Claim("cnpj", cnpj));

        var claims = claimList.ToArray();

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_opts.ExpiresInMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateContextToken(User admin, string perfil, Guid tenantId, Guid? contadorId, Guid? clienteId, string? empresa, string? cnpj = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claimList = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, admin.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, admin.Email),
            new("name", admin.Nome),
            new("role", perfil),
            new("tenant_id", tenantId.ToString()),
            new("acting_admin_id", admin.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        if (contadorId.HasValue)
            claimList.Add(new Claim("contador_id", contadorId.Value.ToString()));

        if (clienteId.HasValue)
            claimList.Add(new Claim("cliente_id", clienteId.Value.ToString()));

        if (!string.IsNullOrEmpty(empresa))
            claimList.Add(new Claim("empresa", empresa));

        if (!string.IsNullOrEmpty(cnpj))
            claimList.Add(new Claim("cnpj", cnpj));

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: claimList.ToArray(),
            expires: DateTime.UtcNow.AddMinutes(_opts.ExpiresInMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public string GenerateTwoFactorToken(Guid userId, Guid tenantId)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _opts.Issuer,
            audience: _opts.Audience,
            claims: [
                new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
                new Claim("tenant_id", tenantId.ToString()),
                new Claim("2fa_pending", "true"),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public Guid? GetUserIdFromTwoFactorToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));

        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            if (principal.FindFirstValue("2fa_pending") != "true") return null;
            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
        catch
        {
            return null;
        }
    }

    public Guid? GetUserIdFromExpiredToken(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opts.Secret));

        try
        {
            var principal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false
            }, out _);

            var sub = principal.FindFirstValue(JwtRegisteredClaimNames.Sub);
            return Guid.TryParse(sub, out var id) ? id : null;
        }
        catch
        {
            return null;
        }
    }
}
