using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ContaReceberConfiguration : IEntityTypeConfiguration<ContaReceber>
{
    public void Configure(EntityTypeBuilder<ContaReceber> b)
    {
        b.ToTable("contas_receber");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(200);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(200);

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.DestinatarioId).HasColumnName("destinatario_id");
        b.Property(e => e.PedidoId).HasColumnName("pedido_id");
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(300).IsRequired();
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasColumnType("numeric(18,2)");
        b.Property(e => e.DataVencimento).HasColumnName("data_vencimento");
        b.Property(e => e.DataPagamento).HasColumnName("data_pagamento");
        b.Property(e => e.Status).HasColumnName("status");
        b.Property(e => e.FormaPagamento).HasColumnName("forma_pagamento").HasMaxLength(100);
        b.Property(e => e.Observacao).HasColumnName("observacao").HasMaxLength(1000);

        b.HasOne(e => e.Cliente).WithMany(c => c.ContasReceber)
            .HasForeignKey(e => e.ClienteId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(e => e.Destinatario).WithMany()
            .HasForeignKey(e => e.DestinatarioId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Pedido).WithMany()
            .HasForeignKey(e => e.PedidoId).OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(e => e.TenantId);
        b.HasIndex(e => e.ClienteId);
        b.HasIndex(e => e.DestinatarioId);
        b.HasIndex(e => e.Status);
        b.HasIndex(e => e.DataVencimento);
    }
}
