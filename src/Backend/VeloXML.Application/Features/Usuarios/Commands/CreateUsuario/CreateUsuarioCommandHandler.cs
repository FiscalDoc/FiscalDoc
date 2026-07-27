using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.CreateUsuario;

public sealed class CreateUsuarioCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ILogger<CreateUsuarioCommandHandler> logger)
    : IRequestHandler<CreateUsuarioCommand, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(CreateUsuarioCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<PerfilEnum>(request.Perfil, ignoreCase: true, out var perfil))
        {
            logger.LogWarning("Tentativa de criar usuário com perfil inválido: {Perfil}", request.Perfil);
            return Result.Failure<UsuarioDto>(ResultError.Validation("Perfil", "Perfil inválido."));
        }

        if (perfil == PerfilEnum.Cliente && request.ClienteId is null)
            return Result.Failure<UsuarioDto>(ResultError.Validation("ClienteId", "Cliente é obrigatório para usuários do tipo Cliente."));

        if (perfil == PerfilEnum.UsuarioContador && request.ContadorId is null)
            return Result.Failure<UsuarioDto>(ResultError.Validation("ContadorId", "Contador é obrigatório para usuários do tipo Usuário de Contador."));

        if (request.ClienteId is not null && await uow.Clientes.GetByIdAsync(request.ClienteId.Value, ct) is null)
            return Result.Failure<UsuarioDto>(ResultError.Validation("ClienteId", "Cliente informado não existe."));

        if (request.ContadorId is not null && await uow.Contadores.GetByIdAsync(request.ContadorId.Value, ct) is null)
            return Result.Failure<UsuarioDto>(ResultError.Validation("ContadorId", "Contador informado não existe."));

        var emailNorm = request.Email.Trim().ToLowerInvariant();
        var existing = await uow.Users.GetByEmailAsync(emailNorm, ct);
        if (existing is not null)
            return Result.Failure<UsuarioDto>(ResultError.Conflict("E-mail já cadastrado."));

        var user = new User
        {
            TenantId     = currentUser.TenantId!.Value,
            Nome         = request.Nome,
            Email        = emailNorm,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil       = perfil,
            ContadorId   = request.ContadorId,
            ClienteId    = request.ClienteId,
            Ativo        = true
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Usuário {UserId} ({Email}) criado com perfil {Perfil}", user.Id, user.Email, user.Perfil);

        string? nomeContador = null;
        if (user.ContadorId.HasValue)
        {
            var contador = await uow.Contadores.GetByIdAsync(user.ContadorId.Value, ct);
            nomeContador = contador?.Nome;
        }

        return Result.Success(new UsuarioDto(
            user.Id, user.Nome, user.Email, user.Perfil.ToString(), user.Ativo,
            user.ContadorId, nomeContador, user.ClienteId, null,
            user.TwoFactorHabilitado, user.CreatedAt));
    }
}
