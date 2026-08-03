using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Infrastructure.Auth;
using VeloXML.Infrastructure.Cache;
using VeloXML.Infrastructure.Email;
using VeloXML.Infrastructure.Jobs;
using VeloXML.Infrastructure.Storage;
using VeloXML.Infrastructure.Webhooks;
using VeloXML.SharedKernel;

namespace VeloXML.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
        services.Configure<StorageOptions>(config.GetSection(StorageOptions.Section));
        services.Configure<S3Options>(config.GetSection(S3Options.Section));
        services.Configure<EmailOptions>(config.GetSection(EmailOptions.Section));
        services.Configure<CacheOptions>(config.GetSection(CacheOptions.Section));

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUserService>();
        services.AddScoped<ICurrentTenant, CurrentTenantService>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddSingleton<ITotpService, TotpService>();
        services.AddSingleton<Storage.DocumentoDownloadTokenService>();

        // "Storage:Provider" ausente/"Minio" mantém o comportamento de sempre (dev local,
        // sem custo AWS). Só produção define "S3" via variável de ambiente no Coolify.
        var storageProvider = config["Storage:Provider"] ?? "Minio";
        if (storageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IStorageService, S3StorageService>();
        else
            services.AddSingleton<IStorageService, MinioStorageService>();

        services.AddSingleton<ICacheService, RedisCacheService>();
        services.AddScoped<IEmailService, MailPitEmailService>();
        services.AddHostedService<StorageBucketInitializer>();
        services.AddScoped<ImportarXmlEmailJob>();
        services.AddScoped<MigrarArquivosParaS3Job>();
        services.AddScoped<AlertaPedidoParadoJob>();
        services.AddScoped<IWebhookService, WebhookService>();
        services.AddHttpClient("webhook").ConfigurePrimaryHttpMessageHandler(() =>
            new HttpClientHandler { ServerCertificateCustomValidationCallback = (_, _, _, _) => true });

        var jwtOpts = config.GetSection(JwtOptions.Section).Get<JwtOptions>()!;
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(o =>
            {
                o.MapInboundClaims = false;
                o.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOpts.Secret)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtOpts.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOpts.Audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = "name",
                    RoleClaimType = "role"
                };
            })
            .AddScheme<AppKeyAuthenticationOptions, AppKeyAuthenticationHandler>(
                AppKeyAuthenticationOptions.SchemeName, _ => { });

        services.AddAuthorization();

        return services;
    }
}
