using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ProdutoConfiguration : IEntityTypeConfiguration<Produto>
{
    public void Configure(EntityTypeBuilder<Produto> b)
    {
        b.ToTable("produtos");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.Codigo).HasColumnName("codigo").HasMaxLength(50).IsRequired();
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(200).IsRequired();
        b.Property(e => e.Ncm).HasColumnName("ncm").HasMaxLength(10);
        b.Property(e => e.Unidade).HasColumnName("unidade").HasMaxLength(10).HasDefaultValue("UN");
        b.Property(e => e.PrecoUnitario).HasColumnName("preco_unitario").HasPrecision(18, 4);
        b.Property(e => e.Cfop).HasColumnName("cfop").HasMaxLength(10);
        b.Property(e => e.AliquotaIcms).HasColumnName("aliquota_icms").HasPrecision(5, 2);
        b.Property(e => e.AliquotaPis).HasColumnName("aliquota_pis").HasPrecision(5, 2);
        b.Property(e => e.AliquotaCofins).HasColumnName("aliquota_cofins").HasPrecision(5, 2);
        b.Property(e => e.CstIcms).HasColumnName("cst_icms").HasMaxLength(3);
        b.Property(e => e.CstPis).HasColumnName("cst_pis").HasMaxLength(2);
        b.Property(e => e.CstCofins).HasColumnName("cst_cofins").HasMaxLength(2);
        b.Property(e => e.IcmsOrigem).HasColumnName("icms_origem").HasDefaultValue(0);
        b.Property(e => e.ValorCusto).HasColumnName("valor_custo").HasPrecision(18, 4).HasDefaultValue(0);
        b.Property(e => e.PercentualImposto).HasColumnName("percentual_imposto").HasPrecision(5, 2).HasDefaultValue(0);
        b.Property(e => e.IbsCbsCst).HasColumnName("ibs_cbs_cst").HasMaxLength(3);
        b.Property(e => e.IbsCbsClassificacaoTributaria).HasColumnName("ibs_cbs_classificacao_tributaria").HasMaxLength(6);
        b.Property(e => e.Ativo).HasColumnName("ativo");

        b.HasIndex(e => e.ClienteId).HasDatabaseName("ix_produtos_cliente_id");
        b.HasIndex(e => e.TenantId).HasDatabaseName("ix_produtos_tenant_id");
    }
}
