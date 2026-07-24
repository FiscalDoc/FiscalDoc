using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VeloXML.SharedKernel;

namespace VeloXML.Infrastructure.Auth;

public sealed class CurrentUserService(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid? UserId => Guid.TryParse(User?.FindFirstValue(JwtRegisteredClaimNames.Sub), out var id) ? id : null;
    public string? Email => User?.FindFirstValue(JwtRegisteredClaimNames.Email);
    public string? Name => User?.FindFirstValue("name");
    public string? Role => User?.FindFirstValue("role");
    public Guid? TenantId => Guid.TryParse(User?.FindFirstValue("tenant_id"), out var id) ? id : null;
    public Guid? ContadorId => Guid.TryParse(User?.FindFirstValue("contador_id"), out var id) ? id : null;
    public Guid? ClienteId  => Guid.TryParse(User?.FindFirstValue("cliente_id"),  out var id) ? id : null;
    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;
}
