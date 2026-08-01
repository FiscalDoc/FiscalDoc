using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class ImportacaoXmlLogConfiguration : IEntityTypeConfiguration<ImportacaoXmlLog>
{
    public void Configure(EntityTypeBuilder<ImportacaoXmlLog> b)
    {
        b.ToTable("importacao_xml_logs");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        // Sem navegação/FK pra Tenant de propósito (mesmo padrão do AuditLog) — o job roda em
        // background sem usuário logado, então o tenant é gravado explicitamente a partir do
        // próprio cliente processado, e não deve travar em constraint de referência.
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.ContadorId).HasColumnName("contador_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Origem).HasColumnName("origem").HasConversion<string>().HasMaxLength(20)
            .HasDefaultValue(Domain.Enums.OrigemImportacaoEnum.ImportacaoEmail);
        b.Property(e => e.ExecutadoEm).HasColumnName("executado_em");
        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.ClienteNome).HasColumnName("cliente_nome").HasMaxLength(200).IsRequired();
        b.Property(e => e.EmailsEncontrados).HasColumnName("emails_encontrados");
        b.Property(e => e.XmlsProcessados).HasColumnName("xmls_processados");
        b.Property(e => e.XmlsImportados).HasColumnName("xmls_importados");
        b.Property(e => e.Erros).HasColumnName("erros");
        // "text" sem limite — mensagem de exceção completa, sem truncar como no card de resumo.
        b.Property(e => e.MensagemErro).HasColumnName("mensagem_erro").HasColumnType("text");

        b.HasIndex(e => new { e.TenantId, e.ExecutadoEm });
        b.HasIndex(e => new { e.TenantId, e.Origem });
        b.HasIndex(e => e.ClienteId);
    }
}
