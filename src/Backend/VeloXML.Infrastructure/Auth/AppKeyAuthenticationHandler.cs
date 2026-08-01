using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Auth;

public sealed class AppKeyAuthenticationOptions : AuthenticationSchemeOptions
{
    public const string SchemeName = "AppKey";
    public const string HeaderName = "X-App-Key";
}

// Autentica requisições externas (ERP/emissor de NF-e do cliente) usando a AppKey
// gerada por cliente (Cliente.AppKey), sem exigir login de usuário/JWT. Mapeia pros
// mesmos claims que o JWT usa (tenant_id, cliente_id, contador_id) pra reaproveitar
// toda a resolução de tenant/cliente já existente (CurrentUserService, query filters).
public sealed class AppKeyAuthenticationHandler(
    IOptionsMonitor<AppKeyAuthenticationOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IUnitOfWork uow)
    : AuthenticationHandler<AppKeyAuthenticationOptions>(options, logger, encoder)
{
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(AppKeyAuthenticationOptions.HeaderName, out var values))
            return AuthenticateResult.NoResult();

        var appKey = values.ToString();
        if (string.IsNullOrWhiteSpace(appKey))
            return AuthenticateResult.NoResult();

        var cliente = await uow.Clientes.GetByAppKeyAsync(appKey, Context.RequestAborted);
        if (cliente is null)
            return AuthenticateResult.Fail("AppKey inválida.");

        if (!cliente.Ativo)
            return AuthenticateResult.Fail("Cliente inativo.");

        var claims = new List<Claim>
        {
            new("sub", cliente.Id.ToString()),
            new("cliente_id", cliente.Id.ToString()),
            new("tenant_id", cliente.TenantId.ToString()),
            new("contador_id", cliente.ContadorId.ToString()),
            new("role", "Cliente"),
            new("name", cliente.RazaoSocial),
        };
        if (!string.IsNullOrWhiteSpace(cliente.Email))
            claims.Add(new Claim("email", cliente.Email));

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);
        return AuthenticateResult.Success(ticket);
    }
}
