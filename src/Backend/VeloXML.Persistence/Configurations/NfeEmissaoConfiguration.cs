using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class NfeEmissaoConfiguration : IEntityTypeConfiguration<NfeEmissao>
{
    public void Configure(EntityTypeBuilder<NfeEmissao> b)
    {
        b.ToTable("nfe_emissoes");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        // Sem FK pra Tenant de propósito — ver comentário na entidade.
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.PedidoId).HasColumnName("pedido_id");
        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.Ref).HasColumnName("ref").HasMaxLength(100).IsRequired();
        b.Property(e => e.Ambiente).HasColumnName("ambiente").HasMaxLength(20).HasDefaultValue("homologacao");
        b.Property(e => e.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(20);
        b.Property(e => e.MensagemErro).HasColumnName("mensagem_erro").HasColumnType("text");
        // 64, não 44 (o tamanho "oficial" da chave de acesso) — de propósito: já vimos a Focus
        // devolver esse campo maior que 44 em algum cenário real, e isso é só armazenamento
        // (não validação), então uma coluna curta demais só derruba a finalização à toa.
        b.Property(e => e.ChaveAcesso).HasColumnName("chave_acesso").HasMaxLength(64);
        b.Property(e => e.Numero).HasColumnName("numero").HasMaxLength(20);
        b.Property(e => e.Serie).HasColumnName("serie").HasMaxLength(10);
        b.Property(e => e.DocumentoId).HasColumnName("documento_id");
        b.Property(e => e.UltimoPayloadRespostaJson).HasColumnName("ultimo_payload_resposta_json").HasColumnType("text");
        b.Property(e => e.SolicitadoPorNome).HasColumnName("solicitado_por_nome").HasMaxLength(256);
        b.Property(e => e.ErrosDetalhadosJson).HasColumnName("erros_detalhados_json").HasColumnType("text");

        b.HasIndex(e => e.Ref).IsUnique();
        b.HasIndex(e => new { e.PedidoId, e.CreatedAt });
    }
}
