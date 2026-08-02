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
        b.Property(e => e.Numero).HasColumnName("numero").UseSequence("pedidos_numero_seq").ValueGeneratedOnAdd();
        b.Property(e => e.Status).HasColumnName("status").HasMaxLength(20);
        b.Property(e => e.Observacoes).HasColumnName("observacoes");
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasPrecision(18, 2);

        b.Property(e => e.NaturezaOperacao).HasColumnName("natureza_operacao").HasMaxLength(60).IsRequired().HasDefaultValue("Venda de mercadoria");
        b.Property(e => e.DataSaida).HasColumnName("data_saida");
        b.Property(e => e.FormaPagamento).HasColumnName("forma_pagamento").HasMaxLength(20);
        b.Property(e => e.MeioPagamento).HasColumnName("meio_pagamento").HasMaxLength(20);
        b.Property(e => e.InformacoesComplementares).HasColumnName("informacoes_complementares");
        b.Property(e => e.DocumentoId).HasColumnName("documento_id");

        b.HasOne(e => e.Destinatario).WithMany().HasForeignKey(e => e.DestinatarioId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Documento).WithMany().HasForeignKey(e => e.DocumentoId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.Itens).WithOne(i => i.Pedido).HasForeignKey(i => i.PedidoId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(e => e.ClienteId).HasDatabaseName("ix_pedidos_cliente_id");
        b.HasIndex(e => e.TenantId).HasDatabaseName("ix_pedidos_tenant_id");
        b.HasIndex(e => e.Numero).HasDatabaseName("ix_pedidos_numero");
    }
}
