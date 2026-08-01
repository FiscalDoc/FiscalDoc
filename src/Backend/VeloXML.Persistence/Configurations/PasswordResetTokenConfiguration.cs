using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> b)
    {
        b.ToTable("password_reset_tokens");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.UserId).HasColumnName("user_id");
        b.Property(e => e.Token).HasColumnName("token").HasMaxLength(512).IsRequired();
        b.Property(e => e.ExpiresAt).HasColumnName("expires_at");
        b.Property(e => e.UsedAt).HasColumnName("used_at");

        b.Ignore(e => e.IsExpired);
        b.Ignore(e => e.IsUsed);
        b.Ignore(e => e.IsActive);

        b.HasIndex(e => e.Token).IsUnique();
        b.HasIndex(e => new { e.UserId, e.ExpiresAt });
    }
}
