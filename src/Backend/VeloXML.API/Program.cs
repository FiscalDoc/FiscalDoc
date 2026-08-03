using Hangfire;
using Hangfire.Dashboard;
using Hangfire.PostgreSql;
using MediatR;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using VeloXML.API.Middleware;
using VeloXML.API.Startup;
using VeloXML.Application.Features.Configuracoes.Queries.GetIntervaloImportacao;
using VeloXML.Infrastructure.Jobs;
using VeloXML.Application;
using VeloXML.Infrastructure;
using VeloXML.Persistence;
using VeloXML.Persistence.Seed;

// O app trabalha só em UTC (BaseEntity.CreatedAt, DataEmissao, etc.) mas campos que vêm de
// JSON de requisição (ex.: Pedido.DataSaida, filtros de data "de/ate") chegam com
// DateTimeKind.Unspecified — o Npgsql 6+ recusa escrever isso em colunas "timestamptz"
// ("Cannot write DateTime with Kind=Unspecified"). Esse switch global evita ficar corrigindo
// isso campo por campo (já apareceu 3 vezes hoje) tratando Unspecified/Local como UTC.
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

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

    // Atrás do proxy do Coolify (Traefik), a conexão com o container é HTTP puro — sem isso,
    // Request.Scheme/Request.Host ficam "http"/internos e qualquer URL absoluta gerada com
    // Url.Action (ex.: o link assinado de download em DocumentosController) sai errada,
    // apontando pra um endereço que o navegador não alcança. KnownNetworks/KnownProxies são
    // limpos porque o proxy roda em outro container da mesma rede Docker, com IP dinâmico —
    // não dá pra fixar um IP conhecido de antemão.
    var forwardedHeadersOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
    };
    forwardedHeadersOptions.KnownIPNetworks.Clear();
    forwardedHeadersOptions.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedHeadersOptions);

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

    app.UseHangfireDashboard("/hangfire", new DashboardOptions
    {
        Authorization = [new HangfireDashboardAuthFilter(app.Configuration)],
    });

    int intervaloImportacaoMinutos;
    using (var scope = app.Services.CreateScope())
    {
        var mediator = scope.ServiceProvider.GetRequiredService<IMediator>();
        var intervaloResult = await mediator.Send(new GetIntervaloImportacaoQuery());
        intervaloImportacaoMinutos = intervaloResult.IsSuccess
            ? intervaloResult.Value
            : GetIntervaloImportacaoQueryHandler.IntervaloPadraoMinutos;
    }

    RecurringJob.AddOrUpdate<ImportarXmlEmailJob>(
        ImportarXmlEmailJob.JobId,
        job => job.ExecuteAsync(CancellationToken.None),
        $"*/{intervaloImportacaoMinutos} * * * *");

    RecurringJob.AddOrUpdate<AlertaPedidoParadoJob>(
        AlertaPedidoParadoJob.JobId,
        job => job.ExecuteAsync(CancellationToken.None),
        "0 6 * * *");

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
