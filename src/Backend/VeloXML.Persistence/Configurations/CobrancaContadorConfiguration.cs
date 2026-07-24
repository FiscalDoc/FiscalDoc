using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class CobrancaContadorConfiguration : IEntityTypeConfiguration<CobrancaContador>
{
    public void Configure(EntityTypeBuilder<CobrancaContador> b)
    {
        b.ToTable("cobrancas_contador");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.ContadorId).HasColumnName("contador_id").IsRequired();
        b.Property(e => e.Mes).HasColumnName("mes").IsRequired();
        b.Property(e => e.Ano).HasColumnName("ano").IsRequired();
        b.Property(e => e.TotalClientes).HasColumnName("total_clientes");
        b.Property(e => e.ValorPorCliente).HasColumnName("valor_por_cliente").HasColumnType("numeric(18,2)");
        b.Property(e => e.ValorBase).HasColumnName("valor_base").HasColumnType("numeric(18,2)");
        b.Property(e => e.LimiteXmlTotal).HasColumnName("limite_xml_total");
        b.Property(e => e.XmlsProcessados).HasColumnName("xmls_processados");
        b.Property(e => e.XmlsExcedentes).HasColumnName("xmls_excedentes");
        b.Property(e => e.ValorExcedente).HasColumnName("valor_excedente").HasColumnType("numeric(18,2)");
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasColumnType("numeric(18,2)");
        b.Property(e => e.Status).HasColumnName("status");
        b.Property(e => e.DataVencimento).HasColumnName("data_vencimento");
        b.Property(e => e.DataPagamento).HasColumnName("data_pagamento");
        b.Property(e => e.Observacao).HasColumnName("observacao").HasMaxLength(1000);

        b.HasIndex(e => new { e.ContadorId, e.Mes, e.Ano }).IsUnique().HasFilter("deleted_at IS NULL");
        b.HasIndex(e => e.TenantId);
    }
}
