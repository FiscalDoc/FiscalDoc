using MediatR;
using VeloXML.Application.Features.Usuarios.Commands.CreateUsuario;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.CreateClienteUsuario;

public sealed class CreateClienteUsuarioCommandHandler(IMediator mediator, ICurrentUser currentUser)
    : IRequestHandler<CreateClienteUsuarioCommand, Result<UsuarioDto>>
{
    public async Task<Result<UsuarioDto>> Handle(CreateClienteUsuarioCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<UsuarioDto>(ResultError.Unauthorized("Você não tem permissão para criar usuários deste cliente."));

        return await mediator.Send(
            new CreateUsuarioCommand(request.Nome, request.Email, nameof(PerfilEnum.Cliente), null, request.ClienteId),
            ct);
    }
}
