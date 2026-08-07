using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.ResetSenhaClienteUsuario;

public record ResetSenhaClienteUsuarioCommand(Guid ClienteId, Guid Id) : IRequest<Result>;
