using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetUsuarioById;

public sealed class GetUsuarioByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetUsuarioByIdQuery, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(GetUsuarioByIdQuery request, CancellationToken ct)
    {
        var user = await uow.Users.GetByIdAsync(request.Id, ct)
            ?? throw new NotFoundException("Usuário", request.Id);

        string? nomeContador = null;
        if (user.ContadorId.HasValue)
        {
            var contador = await uow.Contadores.GetByIdAsync(user.ContadorId.Value, ct);
            nomeContador = contador?.Nome;
        }

        return Result.Success(new UsuarioDto(
            user.Id, user.Nome, user.Email, user.Perfil.ToString(), user.Ativo,
            user.ContadorId, nomeContador, user.ClienteId, null,
            user.TwoFactorHabilitado, user.CreatedAt, user.UltimoAcessoEm));
    }
}
