namespace VeloXML.SharedKernel;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    string? Name { get; }
    string? Role { get; }
    Guid? TenantId { get; }
    Guid? ContadorId { get; }
    Guid? ClienteId { get; }
    // Presente só em tokens de "atuar como" (impersonação) — Guid do Administrador real por
    // trás da sessão. Null numa sessão normal.
    Guid? ActingAdminId { get; }
    bool IsAuthenticated { get; }
}
