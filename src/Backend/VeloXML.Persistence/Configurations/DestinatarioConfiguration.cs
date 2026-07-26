using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class DestinatarioConfiguration : IEntityTypeConfiguration<Destinatario>
{
    public void Configure(EntityTypeBuilder<Destinatario> b)
    {
        b.ToTable("destinatarios");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.RazaoSocial).HasColumnName("razao_social").HasMaxLength(200).IsRequired();
        b.Property(e => e.NomeFantasia).HasColumnName("nome_fantasia").HasMaxLength(200);
        b.Property(e => e.CpfCnpj).HasColumnName("cpf_cnpj").HasMaxLength(18);
        b.Property(e => e.InscricaoEstadual).HasColumnName("inscricao_estadual").HasMaxLength(30);
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(200);
        b.Property(e => e.Telefone).HasColumnName("telefone").HasMaxLength(20);
        b.Property(e => e.Logradouro).HasColumnName("logradouro").HasMaxLength(200);
        b.Property(e => e.Numero).HasColumnName("numero").HasMaxLength(20);
        b.Property(e => e.Complemento).HasColumnName("complemento").HasMaxLength(100);
        b.Property(e => e.Bairro).HasColumnName("bairro").HasMaxLength(100);
        b.Property(e => e.Cidade).HasColumnName("cidade").HasMaxLength(100);
        b.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(2);
        b.Property(e => e.Cep).HasColumnName("cep").HasMaxLength(9);
        b.Property(e => e.CodigoIbgeCidade).HasColumnName("codigo_ibge_cidade").HasMaxLength(10);
        b.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true);

        b.HasIndex(e => e.ClienteId).HasDatabaseName("ix_destinatarios_cliente_id");
        b.HasIndex(e => e.TenantId).HasDatabaseName("ix_destinatarios_tenant_id");
    }
}
