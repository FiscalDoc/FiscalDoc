using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.UpdateUsuario;

public sealed class UpdateUsuarioCommandHandler(IUnitOfWork uow, ILogger<UpdateUsuarioCommandHandler> logger)
    : IRequestHandler<UpdateUsuarioCommand, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(UpdateUsuarioCommand request, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(request.Id, ct);
        if (user is null)
        {
            logger.LogWarning("Tentativa de atualizar usuário inexistente {UserId}", request.Id);
            return Result.Failure<UsuarioDto>(ResultError.NotFound("Usuário"));
        }

        user.Nome  = request.Nome;
        user.Ativo = request.Ativo;

        if (!string.IsNullOrWhiteSpace(request.NovaSenha))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);

        uow.Users.Update(user);
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
