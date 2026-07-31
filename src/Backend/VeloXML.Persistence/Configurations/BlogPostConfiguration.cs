using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class BlogPostConfiguration : IEntityTypeConfiguration<BlogPost>
{
    public void Configure(EntityTypeBuilder<BlogPost> b)
    {
        b.ToTable("blog_posts");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Titulo).HasColumnName("titulo").HasMaxLength(200).IsRequired();
        b.Property(e => e.Slug).HasColumnName("slug").HasMaxLength(220).IsRequired();
        b.Property(e => e.Resumo).HasColumnName("resumo").HasMaxLength(500);
        b.Property(e => e.Conteudo).HasColumnName("conteudo").HasColumnType("text").IsRequired();
        b.Property(e => e.ImagemCapaKey).HasColumnName("imagem_capa_key").HasMaxLength(300);
        b.Property(e => e.CategoriaId).HasColumnName("categoria_id");
        b.Property(e => e.Tags).HasColumnName("tags").HasColumnType("text[]");
        b.Property(e => e.Autor).HasColumnName("autor").HasMaxLength(120).IsRequired();
        b.Property(e => e.DataPublicacao).HasColumnName("data_publicacao");
        b.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).HasDefaultValue("Rascunho");
        b.Property(e => e.Visualizacoes).HasColumnName("visualizacoes").HasDefaultValue(0);
        b.Property(e => e.MetaTitulo).HasColumnName("meta_titulo").HasMaxLength(200);
        b.Property(e => e.MetaDescricao).HasColumnName("meta_descricao").HasMaxLength(300);

        b.HasOne(e => e.Categoria).WithMany(c => c.Posts)
            .HasForeignKey(e => e.CategoriaId).OnDelete(DeleteBehavior.SetNull);

        // Sem o filtro, um post excluído (soft-delete) trava o slug pra sempre — a checagem de
        // unicidade em BlogSlugResolver já ignora registros com deleted_at preenchido, então o
        // índice do banco precisa fazer o mesmo, senão os dois discordam e o insert falha com
        // "duplicate key" mesmo quando o slug já está livre pra reuso.
        b.HasIndex(e => e.Slug).IsUnique().HasDatabaseName("ix_blog_posts_slug").HasFilter("deleted_at IS NULL");
        b.HasIndex(e => e.Status).HasDatabaseName("ix_blog_posts_status");
    }
}
