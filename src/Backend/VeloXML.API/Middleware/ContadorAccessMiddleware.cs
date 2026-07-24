using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.API.Middleware;

public sealed class ContadorAccessMiddleware(RequestDelegate next)
{
    private static readonly string[] BypassPaths = ["/api/v1/auth", "/health", "/swagger", "/hangfire"];

    public async Task InvokeAsync(HttpContext context, ICurrentUser currentUser, IUnitOfWork uow)
    {
        // Apenas usuários autenticados com ContadorId associado precisam da verificação
        if (currentUser.IsAuthenticated && currentUser.ContadorId.HasValue
            && !BypassPaths.Any(p => context.Request.Path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase)))
        {
            var contador = await uow.Contadores.GetByIdAsync(currentUser.ContadorId.Value);

            if (contador?.StatusLicenca == StatusLicencaEnum.Bloqueado)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    type    = "access_blocked",
                    message = "Acesso bloqueado. Entre em contato com o administrador.",
                    motivo  = contador.MotivoBloqueio
                });
                return;
            }

            if (contador?.DataLimiteAcesso.HasValue == true && contador.DataLimiteAcesso.Value.Date < DateTime.UtcNow.Date)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    type    = "access_blocked",
                    message = "Seu período de avaliação expirou. Entre em contato com o administrador para renovar o acesso.",
                    motivo  = "Período de avaliação gratuito encerrado"
                });
                return;
            }
        }

        await next(context);
    }
}
