using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class AlertaConfiguration : IEntityTypeConfiguration<Alerta>
{
    public void Configure(EntityTypeBuilder<Alerta> b)
    {
        b.ToTable("alertas");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.DocumentoId).HasColumnName("documento_id");
        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(500).IsRequired();
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(2000).IsRequired();
        b.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(50).IsRequired();
        b.Property(e => e.Severidade).HasColumnName("severidade").HasMaxLength(20).HasDefaultValue("info");
        b.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        b.Property(e => e.LidoEm).HasColumnName("lido_em");
        b.Property(e => e.LidoPor).HasColumnName("lido_por").HasMaxLength(256);

        b.HasIndex(e => new { e.TenantId, e.Status });
        b.HasIndex(e => new { e.TenantId, e.ClienteId });
        b.HasIndex(e => e.DocumentoId);

        b.HasOne(e => e.Cliente).WithMany().HasForeignKey(e => e.ClienteId).OnDelete(DeleteBehavior.Restrict);
    }
}
