using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ArquivoConfiguration : IEntityTypeConfiguration<Arquivo>
{
    public void Configure(EntityTypeBuilder<Arquivo> b)
    {
        b.ToTable("arquivos");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.DocumentoId).HasColumnName("documento_id");
        b.Property(e => e.NomeArquivo).HasColumnName("nome_arquivo").HasMaxLength(500).IsRequired();
        b.Property(e => e.NomeOriginal).HasColumnName("nome_original").HasMaxLength(500).IsRequired();
        b.Property(e => e.Bucket).HasColumnName("bucket").HasMaxLength(100).IsRequired();
        b.Property(e => e.ObjectKey).HasColumnName("object_key").HasMaxLength(1000).IsRequired();
        b.Property(e => e.MimeType).HasColumnName("mime_type").HasMaxLength(100).IsRequired();
        b.Property(e => e.Hash).HasColumnName("hash").HasMaxLength(64);
        b.Property(e => e.Url).HasColumnName("url").HasMaxLength(2000);
        b.Property(e => e.Tamanho).HasColumnName("tamanho");

        b.HasIndex(e => new { e.TenantId, e.Hash }).HasFilter("hash IS NOT NULL AND deleted_at IS NULL");
        b.HasIndex(e => e.DocumentoId);
        b.HasIndex(e => e.ObjectKey);
    }
}
