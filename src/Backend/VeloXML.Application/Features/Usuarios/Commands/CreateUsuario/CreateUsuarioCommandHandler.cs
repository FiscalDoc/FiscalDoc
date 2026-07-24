using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.CreateUsuario;

public sealed class CreateUsuarioCommandHandler(IUnitOfWork uow, ICurrentTenant tenant)
    : IRequestHandler<CreateUsuarioCommand, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(CreateUsuarioCommand request, CancellationToken ct)
    {
        if (!Enum.TryParse<PerfilEnum>(request.Perfil, out var perfil))
            return Result.Failure<UsuarioDto>(ResultError.Validation("Perfil", "Perfil inválido."));

        if (perfil == PerfilEnum.Cliente && request.ContadorId is null)
            return Result.Failure<UsuarioDto>(ResultError.Validation("ContadorId", "Contador é obrigatório para usuários do tipo Cliente."));

        var existing = await uow.Users.GetByEmailAsync(request.Email.ToLowerInvariant(), ct);
        if (existing is not null)
            return Result.Failure<UsuarioDto>(ResultError.Conflict("E-mail já cadastrado."));

        var user = new User
        {
            TenantId     = tenant.TenantId!.Value,
            Nome         = request.Nome,
            Email        = request.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil       = perfil,
            ContadorId   = request.ContadorId,
            ClienteId    = request.ClienteId,
            Ativo        = true
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

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
