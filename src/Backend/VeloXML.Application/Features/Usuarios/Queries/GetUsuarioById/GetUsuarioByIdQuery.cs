using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetUsuarioById;

public record GetUsuarioByIdQuery(Guid Id) : IRequest<Result<UsuarioDto>>;
