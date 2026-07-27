using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarios;

public sealed class GetClienteUsuariosQueryHandler(IMediator mediator, ICurrentUser currentUser)
    : IRequestHandler<GetClienteUsuariosQuery, Result<PagedResult<UsuarioDto>>>
{
    public async Task<Result<PagedResult<UsuarioDto>>> Handle(GetClienteUsuariosQuery request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<PagedResult<UsuarioDto>>(ResultError.Unauthorized("Você não tem permissão para acessar usuários deste cliente."));

        return await mediator.Send(
            new GetUsuariosQuery(request.Termo, null, request.Page, request.PageSize, request.ClienteId),
            ct);
    }
}
