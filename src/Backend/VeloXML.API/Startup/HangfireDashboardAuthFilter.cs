using System.Text;
using Hangfire.Dashboard;

namespace VeloXML.API.Startup;

/// <summary>
/// Basic Auth para o /hangfire. Necessário porque o dashboard é acessado por navegação direta
/// no browser (sem o interceptor Angular que injeta o JWT), então a autenticação JWT normal da
/// API não se aplica aqui. Falha fechado: se as credenciais não estiverem configuradas, nega tudo.
/// </summary>
public sealed class HangfireDashboardAuthFilter(IConfiguration configuration) : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        var user = configuration["Hangfire:DashboardUser"];
        var password = configuration["Hangfire:DashboardPassword"];

        if (string.IsNullOrEmpty(user) || string.IsNullOrEmpty(password))
            return false;

        var header = httpContext.Request.Headers.Authorization.ToString();
        if (!header.StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            Desafiar(httpContext);
            return false;
        }

        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(header["Basic ".Length..]));
            var separatorIndex = decoded.IndexOf(':');
            if (separatorIndex < 0)
            {
                Desafiar(httpContext);
                return false;
            }

            var informedUser = decoded[..separatorIndex];
            var informedPassword = decoded[(separatorIndex + 1)..];

            if (informedUser == user && informedPassword == password)
                return true;
        }
        catch (FormatException)
        {
            // header Basic malformado — cai no desafio abaixo
        }

        Desafiar(httpContext);
        return false;
    }

    private static void Desafiar(HttpContext httpContext)
    {
        httpContext.Response.Headers.WWWAuthenticate = "Basic realm=\"Hangfire Dashboard\"";
        httpContext.Response.StatusCode = StatusCodes.Status401Unauthorized;
    }
}
