using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using VeloXML.API.Middleware;
using VeloXML.API.Startup;
using VeloXML.Infrastructure.Jobs;
using VeloXML.Application;
using VeloXML.Infrastructure;
using VeloXML.Persistence;
using VeloXML.Persistence.Seed;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .Enrich.FromLogContext()
           .WriteTo.Console()
           .WriteTo.File("logs/veloxml-.log", rollingInterval: RollingInterval.Day));

    builder.Services.AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            o.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        })
        .ConfigureApiBehaviorOptions(o =>
        {
            o.InvalidModelStateResponseFactory = ctx =>
            {
                var logger = ctx.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
                var errors = ctx.ModelState
                    .Where(kv => kv.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kv => char.ToLowerInvariant(kv.Key[0]) + kv.Key[1..],
                        kv => kv.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

                var message = errors.Count > 0
                    ? string.Join("; ", errors.SelectMany(e => e.Value))
                    : "Requisição inválida.";

                logger.LogWarning("Invalid model state on {Path}: {Message}", ctx.HttpContext.Request.Path, message);

                return new BadRequestObjectResult(new { code = "VALIDATION_ERROR", message, errors });
            };
        });
    builder.Services.AddOpenApi(options =>
    {
        options.AddDocumentTransformer((doc, _, _) =>
        {
            doc.Info.Title = "VeloXML API";
            doc.Info.Version = "v1";
            return Task.CompletedTask;
        });
    });

    builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
        p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

    builder.Services
        .AddApplication()
        .AddInfrastructure(builder.Configuration)
        .AddPersistence(builder.Configuration);

    builder.Services.AddHangfire(cfg => cfg
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UsePostgreSqlStorage(o =>
            o.UseNpgsqlConnection(builder.Configuration.GetConnectionString("DefaultConnection"))));
    builder.Services.AddHangfireServer();

    builder.Services.AddHealthChecks()
        .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection")!)
        .AddRedis(builder.Configuration["Redis:ConnectionString"]!);

    var app = builder.Build();

    // Auto-migrate e seed
    await DatabaseInitializer.MigrateAsync(app.Services);
    await AppSeeder.SeedAsync(app.Services);

    app.UseMiddleware<ExceptionMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/openapi/v1.json", "VeloXML v1"));
    }

    app.UseCors();
    app.UseSerilogRequestLogging();
    app.UseAuthentication();
    app.UseAuthorization();

    // ContadorAccessMiddleware deve rodar APÓS UseAuthentication para ter o JWT processado
    app.UseMiddleware<ContadorAccessMiddleware>();

    // Hangfire dashboard: em produção, proteger com auth (Etapa 5)
    app.UseHangfireDashboard("/hangfire");

    RecurringJob.AddOrUpdate<ImportarXmlEmailJob>(
        "importar-xml-email",
        job => job.ExecuteAsync(CancellationToken.None),
        "*/5 * * * *"); // every 5 minutes

    app.MapControllers();
    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start.");
}
finally
{
    Log.CloseAndFlush();
}
