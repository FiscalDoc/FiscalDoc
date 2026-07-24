using Microsoft.EntityFrameworkCore;
using VeloXML.Domain.Entities;

namespace VeloXML.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User>      Users      { get; }
    DbSet<Contador>  Contadores { get; }
    DbSet<Tenant>    Tenants    { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
