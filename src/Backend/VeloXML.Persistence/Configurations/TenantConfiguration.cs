using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> b)
    {
        b.ToTable("tenants");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(200).IsRequired();
        b.Property(e => e.Cnpj).HasColumnName("cnpj").HasMaxLength(14);
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(256);
        b.Property(e => e.Telefone).HasColumnName("telefone").HasMaxLength(20);
        b.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true);
        b.Property(e => e.PlanoExpiracao).HasColumnName("plano_expiracao");
        b.Property(e => e.Plano).HasColumnName("plano").HasMaxLength(50).HasDefaultValue("Starter");

        b.HasIndex(e => e.Cnpj).IsUnique().HasFilter("cnpj IS NOT NULL AND deleted_at IS NULL");
    }
}
