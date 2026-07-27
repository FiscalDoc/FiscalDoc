using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace VeloXML.API.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (ValidationException ex)
        {
            logger.LogWarning("Validation error: {Message}", ex.Message);
            await WriteAsync(ctx, HttpStatusCode.UnprocessableEntity, "VALIDATION_ERROR",
                string.Join("; ", ex.Errors.Select(e => e.ErrorMessage)));
        }
        catch (Domain.Exceptions.NotFoundException ex)
        {
            await WriteAsync(ctx, HttpStatusCode.NotFound, ex.Code, ex.Message);
        }
        catch (Domain.Exceptions.UnauthorizedException ex)
        {
            await WriteAsync(ctx, HttpStatusCode.Forbidden, ex.Code, ex.Message);
        }
        catch (Domain.Exceptions.DomainException ex)
        {
            await WriteAsync(ctx, HttpStatusCode.BadRequest, ex.Code, ex.Message);
        }
        catch (DbUpdateException ex)
        {
            var inner = ex.InnerException?.Message ?? ex.Message;
            logger.LogError(ex, "Database update error");
            await WriteAsync(ctx, HttpStatusCode.BadRequest, "DB_ERROR", $"Erro ao salvar no banco: {inner}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteAsync(ctx, HttpStatusCode.InternalServerError, "INTERNAL_ERROR",
                $"Erro interno: {ex.Message}");
        }
    }

    private static Task WriteAsync(HttpContext ctx, HttpStatusCode status, string code, string message)
    {
        ctx.Response.StatusCode = (int)status;
        ctx.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new { code, message });
        return ctx.Response.WriteAsync(body);
    }
}
