using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class User : BaseEntity, IAuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public PerfilEnum Perfil { get; set; }
    public bool Ativo { get; set; } = true;
    public Guid? ContadorId { get; set; }
    public Guid? ClienteId { get; set; }
    public bool TwoFactorHabilitado { get; set; }
    public string? TotpSecret { get; set; }
    public DateTime? UltimoAcessoEm { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Tenant? Tenant { get; set; }
    public Contador? Contador { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
