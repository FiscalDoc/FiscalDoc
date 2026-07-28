using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarioById;

public record GetClienteUsuarioByIdQuery(Guid ClienteId, Guid Id) : IRequest<Result<UsuarioDto>>;
