using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;

public record GetUsuariosQuery(string? Termo, string? Perfil, int Page = 1, int PageSize = 50, Guid? ClienteId = null)
    : IRequest<Result<PagedResult<UsuarioDto>>>;
