namespace VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;

public record UsuarioDto(
    Guid Id,
    string Nome,
    string Email,
    string Perfil,
    bool Ativo,
    Guid? ContadorId,
    string? NomeContador,
    Guid? ClienteId,
    string? NomeCliente,
    bool TwoFactorHabilitado,
    DateTime CreatedAt,
    DateTime? UltimoAcessoEm
);
