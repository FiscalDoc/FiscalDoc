namespace VeloXML.Application.Features.Auth.Queries.GetCurrentUser;

public record UserDto(
    Guid Id,
    string Nome,
    string Email,
    string Perfil,
    Guid TenantId,
    bool Ativo,
    string Plano,
    DateTime? PlanoExpiracao,
    DateTime? AcessoExpiracao,  // DataLimiteAcesso do Contador (quando criado pelo admin)
    string? AvatarUrl = null
);
