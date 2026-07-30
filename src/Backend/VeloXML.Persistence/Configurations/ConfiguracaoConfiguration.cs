using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ConfiguracaoConfiguration : IEntityTypeConfiguration<Configuracao>
{
    public void Configure(EntityTypeBuilder<Configuracao> b)
    {
        b.ToTable("configuracoes");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.Chave).HasColumnName("chave").HasMaxLength(100).IsRequired();
        // "text" (sem limite fixo) porque algumas chaves guardam JSON — ex.: o resumo por
        // cliente da última execução do robô de importação de XML, que cresce com a quantidade
        // de clientes com IMAP habilitado e pode passar de 2000 caracteres facilmente.
        b.Property(e => e.Valor).HasColumnName("valor").HasColumnType("text").IsRequired();
        b.Property(e => e.Descricao).HasColumnName("descricao").HasMaxLength(500);
        b.Property(e => e.Global).HasColumnName("global").HasDefaultValue(false);

        b.HasIndex(e => new { e.TenantId, e.ClienteId, e.Chave }).IsUnique().HasFilter("deleted_at IS NULL");
    }
}
