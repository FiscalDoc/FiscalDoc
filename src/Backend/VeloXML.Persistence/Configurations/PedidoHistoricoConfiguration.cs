using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class PedidoHistoricoConfiguration : IEntityTypeConfiguration<PedidoHistorico>
{
    public void Configure(EntityTypeBuilder<PedidoHistorico> b)
    {
        b.ToTable("pedidos_historico");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.PedidoId).HasColumnName("pedido_id");
        b.Property(e => e.Tipo).HasColumnName("tipo").HasMaxLength(50).IsRequired();
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(1000).IsRequired();
        b.Property(e => e.UsuarioNome).HasColumnName("usuario_nome").HasMaxLength(256);

        b.HasIndex(e => e.PedidoId);

        b.HasOne(e => e.Pedido).WithMany().HasForeignKey(e => e.PedidoId).OnDelete(DeleteBehavior.Cascade);
    }
}
