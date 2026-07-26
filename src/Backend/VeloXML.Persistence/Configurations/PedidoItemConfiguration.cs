using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class PedidoItemConfiguration : IEntityTypeConfiguration<PedidoItem>
{
    public void Configure(EntityTypeBuilder<PedidoItem> b)
    {
        b.ToTable("pedido_itens");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");

        b.Property(e => e.PedidoId).HasColumnName("pedido_id");
        b.Property(e => e.ProdutoId).HasColumnName("produto_id");
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(200).IsRequired();
        b.Property(e => e.Unidade).HasColumnName("unidade").HasMaxLength(10).HasDefaultValue("UN");
        b.Property(e => e.Quantidade).HasColumnName("quantidade").HasPrecision(18, 4);
        b.Property(e => e.PrecoUnitario).HasColumnName("preco_unitario").HasPrecision(18, 4);
        b.Property(e => e.Desconto).HasColumnName("desconto").HasPrecision(18, 2);
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasPrecision(18, 2);
        b.Property(e => e.Cfop).HasColumnName("cfop").HasMaxLength(10);
        b.Property(e => e.Ncm).HasColumnName("ncm").HasMaxLength(10);
        b.Property(e => e.AliquotaIcms).HasColumnName("aliquota_icms").HasPrecision(5, 2);
        b.Property(e => e.AliquotaPis).HasColumnName("aliquota_pis").HasPrecision(5, 2);
        b.Property(e => e.AliquotaCofins).HasColumnName("aliquota_cofins").HasPrecision(5, 2);

        b.HasOne(e => e.Produto).WithMany().HasForeignKey(e => e.ProdutoId).OnDelete(DeleteBehavior.Restrict);

        b.HasIndex(e => e.PedidoId).HasDatabaseName("ix_pedido_itens_pedido_id");
    }
}
