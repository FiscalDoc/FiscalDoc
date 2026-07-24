using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VeloXML.Domain.Entities;

namespace VeloXML.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasKey(e => e.Id);
        b.Property(e => e.Id).HasColumnName("id");
        b.Property(e => e.TenantId).HasColumnName("tenant_id");
        b.Property(e => e.CreatedAt).HasColumnName("created_at");
        b.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        b.Property(e => e.DeletedAt).HasColumnName("deleted_at");

        b.Property(e => e.UserId).HasColumnName("user_id");
        b.Property(e => e.Token).HasColumnName("token").HasMaxLength(512).IsRequired();
        b.Property(e => e.ExpiresAt).HasColumnName("expires_at");
        b.Property(e => e.RevokedAt).HasColumnName("revoked_at");
        b.Property(e => e.ReplacedByToken).HasColumnName("replaced_by_token").HasMaxLength(512);
        b.Property(e => e.RevokedReason).HasColumnName("revoked_reason").HasMaxLength(256);

        b.Ignore(e => e.IsExpired);
        b.Ignore(e => e.IsRevoked);
        b.Ignore(e => e.IsActive);

        b.HasIndex(e => e.Token).IsUnique();
        b.HasIndex(e => new { e.UserId, e.ExpiresAt });
    }
}
