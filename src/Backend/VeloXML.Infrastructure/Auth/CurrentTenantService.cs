using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Infrastructure.Auth;

public sealed class CurrentTenantService(IHttpContextAccessor accessor) : ICurrentTenant
{
    public Guid? TenantId
    {
        get
        {
            var user = accessor.HttpContext?.User;

            // Administrador enxerga todos os tenants: os filtros de query em
            // AppDbContext tratam TenantId == null como "sem filtro".
            if (user?.FindFirstValue("role") == nameof(PerfilEnum.Administrador))
                return null;

            var claim = user?.FindFirstValue("tenant_id");
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }
}
