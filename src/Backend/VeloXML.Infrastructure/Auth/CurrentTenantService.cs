using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VeloXML.SharedKernel;

namespace VeloXML.Infrastructure.Auth;

public sealed class CurrentTenantService(IHttpContextAccessor accessor) : ICurrentTenant
{
    public Guid? TenantId
    {
        get
        {
            var claim = accessor.HttpContext?.User?.FindFirstValue("tenant_id");
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}
