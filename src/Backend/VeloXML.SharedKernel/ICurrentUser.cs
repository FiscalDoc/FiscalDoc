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
    bool IsAuthenticated { get; }
}
