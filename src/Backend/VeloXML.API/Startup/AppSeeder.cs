using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Persistence.Context;

namespace VeloXML.API.Startup;

public static class AppSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDbContext>>();

        const string adminEmail = "admin@veloxml.com.br";

        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == adminEmail))
        {
            logger.LogDebug("Admin user already exists, skipping seed.");
            return;
        }

        logger.LogInformation("Seeding admin tenant and user...");

        var tenant = new Tenant
        {
            Nome = "VeloXML Admin",
            Email = adminEmail,
            Plano = "Admin",
            Ativo = true,
        };
        // Admin tenant uses its own Id as TenantId
        tenant.TenantId = tenant.Id;

        var adminUser = new User
        {
            Nome = "Admin VeloXML",
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Perfil = PerfilEnum.Administrador,
            Ativo = true,
            TenantId = tenant.Id,
        };

        db.Tenants.Add(tenant);
        db.Users.Add(adminUser);
        await db.SaveChangesAsync();

        logger.LogInformation("Admin seeded — E-mail: {Email} / Senha: Admin@123", adminEmail);
    }
}
