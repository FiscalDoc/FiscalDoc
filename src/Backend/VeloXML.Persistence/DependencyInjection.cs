using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.Persistence.Context;
using VeloXML.Persistence.UnitOfWork;

namespace VeloXML.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<AppDbContext>(options =>
            options
                .UseNpgsql(config.GetConnectionString("DefaultConnection"),
                    npgsql => npgsql.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
                .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning))
                .EnableDetailedErrors()
                .LogTo(Console.WriteLine, Microsoft.Extensions.Logging.LogLevel.Warning));

        services.AddScoped<IUnitOfWork, UnitOfWork.UnitOfWork>();
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        // Chaves de Data Protection (senha do certificado A1, tokens da Focus NFe) persistidas
        // no Postgres — precisa ficar aqui (não em VeloXML.Infrastructure) porque
        // PersistKeysToDbContext exige o tipo concreto AppDbContext, e Infrastructure não
        // referencia Persistence (Clean Architecture). Fica no mesmo banco que já é
        // comprovadamente durável entre recriações de container — sem depender de volume.
        services.AddDataProtection()
            .SetApplicationName("FiscalDoc")
            .PersistKeysToDbContext<AppDbContext>();

        return services;
    }
}
