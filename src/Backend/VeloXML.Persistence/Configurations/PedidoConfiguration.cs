using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class PedidoConfiguration : IEntityTypeConfiguration<Pedido>
{
    public void Configure(EntityTypeBuilder<Pedido> b)
    {
        b.ToTable("pedidos");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.DestinatarioId).HasColumnName("destinatario_id");
        b.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("Rascunho");
        b.Property(e => e.Observacoes).HasColumnName("observacoes");
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasPrecision(18, 2);

        b.HasOne(e => e.Destinatario).WithMany().HasForeignKey(e => e.DestinatarioId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.Itens).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(e => e.ClienteId).HasDatabaseName("ix_pedidos_cliente_id");
        b.HasIndex(e => e.TenantId).HasDatabaseName("ix_pedidos_tenant_id");
    }
}
