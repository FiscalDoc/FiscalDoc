using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.DeleteClienteUsuario;

public record DeleteClienteUsuarioCommand(Guid ClienteId, Guid Id) : IRequest<Result>;
