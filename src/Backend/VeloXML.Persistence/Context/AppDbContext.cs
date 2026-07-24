using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Context;

public class AppDbContext(
    DbContextOptions<AppDbContext> options,
    ICurrentTenant currentTenant,
    ICurrentUser currentUser) : DbContext(options), IApplicationDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Contador> Contadores => Set<Contador>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Documento> Documentos => Set<Documento>();
    public DbSet<Arquivo> Arquivos => Set<Arquivo>();
    public DbSet<Alerta> Alertas => Set<Alerta>();
    public DbSet<CobrancaContador> CobrancasContador => Set<CobrancaContador>();
    public DbSet<Configuracao> Configuracoes => Set<Configuracao>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Filters evaluated at query-time via closure — safe to always register.
        // Use DeletedAt == null instead of !IsDeleted because EF Core cannot translate computed properties.
        builder.Entity<User>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<Contador>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<Cliente>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<Documento>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<Arquivo>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<Alerta>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);
        builder.Entity<CobrancaContador>().HasQueryFilter(e =>
            (currentTenant.TenantId == null || e.TenantId == currentTenant.TenantId) && e.DeletedAt == null);

        base.OnModelCreating(builder);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        var auditEntries = CaptureAuditEntries();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;

            if (entry.State == EntityState.Added
                && currentTenant.TenantId.HasValue
                && entry.Entity.TenantId == Guid.Empty)
                entry.Entity.TenantId = currentTenant.TenantId.Value;
        }

        var result = await base.SaveChangesAsync(ct);

        if (auditEntries.Count > 0)
        {
            AuditLogs.AddRange(auditEntries);
            await base.SaveChangesAsync(ct);
        }

        return result;
    }

    private List<AuditLog> CaptureAuditEntries()
    {
        var logs = new List<AuditLog>();
        var tenantId = currentTenant.TenantId ?? Guid.Empty;
        var userId = currentUser.UserId?.ToString();

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
                continue;

            // Skip AuditLog itself to prevent recursion
            if (entry.Entity is AuditLog) continue;

            var operacao = entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Modified => "UPDATE",
                EntityState.Deleted => "DELETE",
                _ => "UNKNOWN"
            };

            string? valoresAntigos = null;
            string? valoresNovos = null;

            if (entry.State == EntityState.Modified)
            {
                var antigos = entry.Properties
                    .Where(p => p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.OriginalValue);
                var novos = entry.Properties
                    .Where(p => p.IsModified)
                    .ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
                valoresAntigos = System.Text.Json.JsonSerializer.Serialize(antigos);
                valoresNovos = System.Text.Json.JsonSerializer.Serialize(novos);
            }
            else if (entry.State == EntityState.Added)
            {
                var novos = entry.Properties.ToDictionary(p => p.Metadata.Name, p => p.CurrentValue);
                valoresNovos = System.Text.Json.JsonSerializer.Serialize(novos);
            }

            logs.Add(new AuditLog
            {
                TenantId = tenantId,
                Tabela = entry.Metadata.GetTableName() ?? entry.Metadata.Name,
                Operacao = operacao,
                RegistroId = entry.Entity.Id.ToString(),
                ValoresAntigos = valoresAntigos,
                ValoresNovos = valoresNovos,
                UserId = userId,
            });
        }

        return logs;
    }
}
