using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.DeleteUsuario;

public record DeleteUsuarioCommand(Guid Id) : IRequest<Result>;
