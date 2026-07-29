using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class BlogCategoriaConfiguration : IEntityTypeConfiguration<BlogCategoria>
{
    public void Configure(EntityTypeBuilder<BlogCategoria> b)
    {
        b.ToTable("blog_categorias");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(100).IsRequired();
        b.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(120).IsRequired();

        b.HasIndex(e => e.Slug).IsUnique().HasDatabaseName("ix_blog_categorias_slug");
    }
}
