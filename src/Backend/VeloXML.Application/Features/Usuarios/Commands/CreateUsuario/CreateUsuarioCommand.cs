using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.CreateUsuario;

public record CreateUsuarioCommand(
    string Nome,
    string Email,
    string Perfil,
    Guid? ContadorId,
    Guid? ClienteId
) : IRequest<Result<UsuarioDto>>;
