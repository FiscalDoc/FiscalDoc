using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;

namespace VeloXML.Persistence.Configurations;

public class ContadorConfiguration : IEntityTypeConfiguration<Contador>
{
    public void Configure(EntityTypeBuilder<Contador> b)
    {
        b.ToTable("contadores");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(200).IsRequired();
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
        b.Property(e => e.Telefone).HasColumnName("telefone").HasMaxLength(20);
        b.Property(e => e.Crc).HasColumnName("crc").HasMaxLength(20);
        b.Property(e => e.Empresa).HasColumnName("empresa").HasMaxLength(200);
        b.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true);
        b.Property(e => e.NotifNovasNotas).HasColumnName("notif_novas_notas").HasDefaultValue(true);
        b.Property(e => e.NotifAlertas).HasColumnName("notif_alertas").HasDefaultValue(true);
        b.Property(e => e.NotifResumoSemanal).HasColumnName("notif_resumo_semanal").HasDefaultValue(false);
        b.Property(e => e.NotifConsolidadoMensal).HasColumnName("notif_consolidado_mensal").HasDefaultValue(false);
        b.Property(e => e.CanalNotificacao).HasColumnName("canal_notificacao").HasMaxLength(20).HasDefaultValue("ambos");
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.Property(e => e.StatusLicenca).HasColumnName("status_licenca").HasDefaultValue(StatusLicencaEnum.Ativo);
        b.Property(e => e.MotivoBloqueio).HasColumnName("motivo_bloqueio").HasMaxLength(500);
        b.Property(e => e.DataLimiteAcesso).HasColumnName("data_limite_acesso");
        b.Property(e => e.ValorPorCliente).HasColumnName("valor_por_cliente").HasColumnType("numeric(18,2)").HasDefaultValue(100m);
        b.Property(e => e.LimiteXmlPorCliente).HasColumnName("limite_xml_por_cliente").HasDefaultValue(100);
        b.Property(e => e.ValorXmlExcedente).HasColumnName("valor_xml_excedente").HasColumnType("numeric(18,2)").HasDefaultValue(1m);

        b.HasIndex(e => new { e.TenantId, e.Email }).IsUnique().HasFilter("deleted_at IS NULL");
        b.HasIndex(e => e.TenantId);

        b.HasOne(e => e.Tenant).WithMany(t => t.Contadores).HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.Clientes).WithOne(c => c.Contador).HasForeignKey(c => c.ContadorId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(e => e.Cobrancas).WithOne(c => c.Contador).HasForeignKey(c => c.ContadorId).OnDelete(DeleteBehavior.Cascade);
    }
}
