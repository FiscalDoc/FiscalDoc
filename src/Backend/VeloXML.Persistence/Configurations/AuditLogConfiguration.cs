using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> b)
    {
        b.ToTable("audit_logs");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Tabela).HasColumnName("tabela").HasMaxLength(100).IsRequired();
        b.Property(e => e.Operacao).HasColumnName("operacao").HasMaxLength(20).IsRequired();
        b.Property(e => e.RegistroId).HasColumnName("registro_id").HasMaxLength(36);
        b.Property(e => e.ValoresAntigos).HasColumnName("valores_antigos").HasColumnType("jsonb");
        b.Property(e => e.ValoresNovos).HasColumnName("valores_novos").HasColumnType("jsonb");
        b.Property(e => e.UserId).HasColumnName("user_id").HasMaxLength(36);
        b.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
        b.Property(e => e.UserAgent).HasColumnName("user_agent").HasMaxLength(500);

        b.HasIndex(e => new { e.TenantId, e.CreatedAt });
        b.HasIndex(e => new { e.Tabela, e.RegistroId });
    }
}
