using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarioById;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarioById;

public sealed class GetClienteUsuarioByIdQueryHandler(IMediator mediator, IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetClienteUsuarioByIdQuery, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(GetClienteUsuarioByIdQuery request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<UsuarioDto>(ResultError.Unauthorized("Você não tem permissão para acessar usuários deste cliente."));

        var alvo = await uow.Users.GetByIdAsync(request.Id, ct);
        if (alvo is null || alvo.ClienteId != request.ClienteId)
            return Result.Failure<UsuarioDto>(ResultError.NotFound("Usuário"));

        return await mediator.Send(new GetUsuarioByIdQuery(request.Id), ct);
    }
}
