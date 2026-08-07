using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("users");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.Nome).HasColumnName("nome").HasMaxLength(200).IsRequired();
        b.Property(e => e.Email).HasColumnName("email").HasMaxLength(256).IsRequired();
        b.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(1024).IsRequired();
        b.Property(e => e.Perfil).HasColumnName("perfil").HasConversion<string>().HasMaxLength(30);
        b.Property(e => e.Ativo).HasColumnName("ativo").HasDefaultValue(true).ValueGeneratedNever();
        b.Property(e => e.SenhaDefinida).HasColumnName("senha_definida").HasDefaultValue(true).ValueGeneratedNever();
        b.Property(e => e.ContadorId).HasColumnName("contador_id");
        b.Property(e => e.ClienteId).HasColumnName("cliente_id");
        b.Property(e => e.TwoFactorHabilitado).HasColumnName("two_factor_habilitado").HasDefaultValue(false);
        b.Property(e => e.TotpSecret).HasColumnName("totp_secret").HasMaxLength(256);
        b.Property(e => e.UltimoAcessoEm).HasColumnName("ultimo_acesso_em");
        b.Property(e => e.AvatarObjectKey).HasColumnName("avatar_object_key").HasMaxLength(500);
        b.Property(e => e.CreatedBy).HasColumnName("created_by").HasMaxLength(256);
        b.Property(e => e.UpdatedBy).HasColumnName("updated_by").HasMaxLength(256);

        b.HasIndex(e => new { e.TenantId, e.Email }).IsUnique().HasFilter("deleted_at IS NULL");
        b.HasIndex(e => e.TenantId);

        b.HasOne(e => e.Tenant).WithMany(t => t.Users).HasForeignKey(e => e.TenantId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Contador).WithMany(c => c.Users).HasForeignKey(e => e.ContadorId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(e => e.RefreshTokens).WithOne(r => r.User).HasForeignKey(r => r.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
