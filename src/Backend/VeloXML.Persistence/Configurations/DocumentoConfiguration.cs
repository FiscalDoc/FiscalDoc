using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class DocumentoConfiguration : IEntityTypeConfiguration<Documento>
{
    public void Configure(EntityTypeBuilder<Documento> b)
    {
        b.ToTable("documentos");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.Tipo).HasColumnName("tipo").HasConversion<string>().HasMaxLength(20);
        b.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        b.Property(e => e.OrigemImportacao).HasColumnName("origem_importacao").HasConversion<string>().HasMaxLength(20)
            .HasDefaultValue(Domain.Enums.OrigemImportacaoEnum.Manual);
        b.Property(e => e.Numero).HasColumnName("numero").HasMaxLength(60).IsRequired();
        b.Property(e => e.ChaveAcesso).HasColumnName("chave_acesso").HasMaxLength(64);
        b.Property(e => e.CnpjEmitente).HasColumnName("cnpj_emitente").HasMaxLength(14);
        b.Property(e => e.NomeEmitente).HasColumnName("nome_emitente").HasMaxLength(300);
        b.Property(e => e.CnpjDestinatario).HasColumnName("cnpj_destinatario").HasMaxLength(14);
        b.Property(e => e.NomeDestinatario).HasColumnName("nome_destinatario").HasMaxLength(300);
        b.Property(e => e.DataEmissao).HasColumnName("data_emissao");
        b.Property(e => e.ValorTotal).HasColumnName("valor_total").HasColumnType("numeric(18,2)");
        b.Property(e => e.Observacao).HasColumnName("observacao").HasMaxLength(2000);
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.HasIndex(e => new { e.TenantId, e.ChaveAcesso }).HasFilter("chave_acesso IS NOT NULL AND deleted_at IS NULL");
        b.HasIndex(e => new { e.TenantId, e.ClienteId });
        b.HasIndex(e => new { e.TenantId, e.Tipo });
        b.HasIndex(e => new { e.TenantId, e.Status });
        b.HasIndex(e => e.DataEmissao);

        b.HasMany(e => e.Arquivos).WithOne(a => a.Documento).HasForeignKey(a => a.DocumentoId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(e => e.Alertas).WithOne(a => a.Documento).HasForeignKey(a => a.DocumentoId).OnDelete(DeleteBehavior.SetNull);
    }
}
