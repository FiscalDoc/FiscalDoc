using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.CreateClienteUsuario;

public record CreateClienteUsuarioCommand(
    Guid ClienteId,
    string Nome,
    string Email,
    string Senha
) : IRequest<Result<UsuarioDto>>;
