using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using VeloXML.SharedKernel;

namespace VeloXML.Persistence.Context;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=veloxml;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(options, new NullCurrentTenant(), new NullCurrentUser());
    }

    private sealed class NullCurrentTenant : ICurrentTenant
    {
        public Guid? TenantId => null;
    }

    private sealed class NullCurrentUser : ICurrentUser
    {
        public Guid? UserId => null;
        public string? Email => null;
        public string? Name => null;
        public string? Role => null;
        public Guid? TenantId => null;
        public Guid? ContadorId => null;
        public Guid? ClienteId => null;
        public bool IsAuthenticated => false;
    }
}
