using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.UpdateUsuario;

public record UpdateUsuarioCommand(Guid Id, string Nome, bool Ativo, string? NovaSenha)
    : IRequest<Result<UsuarioDto>>;
