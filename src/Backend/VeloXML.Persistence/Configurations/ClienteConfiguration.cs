using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ClienteConfiguration : IEntityTypeConfiguration<Cliente>
{
    public void Configure(EntityTypeBuilder<Cliente> b)
    {
        b.ToTable("clientes");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.RazaoSocial).HasColumnName("razao_social").HasMaxLength(300).IsRequired();
        b.Property(e => e.NomeFantasia).HasColumnName("nome_fantasia").HasMaxLength(300);
        b.Property(e => e.Cnpj).HasColumnName("cnpj").HasMaxLength(14).IsRequired();
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(256);
        b.Property(e => e.Telefone).HasColumnName("telefone").HasMaxLength(20);
        b.Property(e => e.Endereco).HasColumnName("endereco").HasMaxLength(500);
        b.Property(e => e.Cidade).HasColumnName("cidade").HasMaxLength(100);
        b.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(2);
        b.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true);
        b.Property(e => e.ContadorId).HasColumnName("contador_id");
        b.Property(e => e.AppKey).HasColumnName("app_key").HasMaxLength(32).IsRequired();
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.Property(e => e.WebhookHabilitado).HasColumnName("webhook_habilitado").HasDefaultValue(false);
        b.Property(e => e.WebhookUrl).HasColumnName("webhook_url").HasMaxLength(1024);

        b.Property(e => e.ImapHabilitado).HasColumnName("imap_habilitado").HasDefaultValue(false);
        b.Property(e => e.ImapHost).HasColumnName("imap_host").HasMaxLength(256);
        b.Property(e => e.ImapPort).HasColumnName("imap_port").HasDefaultValue(993);
        b.Property(e => e.ImapEmail).HasColumnName("imap_email").HasMaxLength(256);
        b.Property(e => e.ImapSenha).HasColumnName("imap_senha").HasMaxLength(512);

        b.HasIndex(e => new { e.TenantId, e.Cnpj }).IsUnique().HasFilter("deleted_at IS NULL");
        b.HasIndex(e => e.TenantId);
        b.HasIndex(e => e.ContadorId);

        b.HasOne(e => e.Tenant).WithMany(t => t.Clientes).HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.Documentos).WithOne(d => d.Cliente).HasForeignKey(d => d.ClienteId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.Configuracoes).WithOne(c => c.Cliente).HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.Cascade);
    }
}
