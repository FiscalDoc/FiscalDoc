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
    // false = ainda não fez o primeiro acesso (senha atual é um hash aleatório inutilizável,
    // só o link de definição de senha por e-mail permite entrar). true = já definiu a própria
    // senha, seja no primeiro acesso ou via redefinição.
    public bool SenhaDefinida { get; set; } = true;
    public Guid? ContadorId { get; set; }
    public Guid? ClienteId { get; set; }
    public bool TwoFactorHabilitado { get; set; }
    public string? TotpSecret { get; set; }
    public DateTime? UltimoAcessoEm { get; set; }
    // Chave do objeto no storage (bucket "avatars") — null quando o usuário nunca subiu uma
    // foto, nesse caso o frontend mostra as iniciais do nome.
    public string? AvatarObjectKey { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Tenant? Tenant { get; set; }
    public Contador? Contador { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
