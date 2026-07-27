using MediatR;
using VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetClienteUsuarios;

public record GetClienteUsuariosQuery(Guid ClienteId, string? Termo, int Page = 1, int PageSize = 50)
    : IRequest<Result<PagedResult<UsuarioDto>>>;
