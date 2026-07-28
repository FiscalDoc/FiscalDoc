using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Queries.GetUsuarios;

public sealed class GetUsuariosQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetUsuariosQuery, Result<PagedResult<UsuarioDto>>>
{
    public async Task<Result<PagedResult<UsuarioDto>>> Handle(GetUsuariosQuery request, CancellationToken ct)
    {
        var q = db.Users
            .Include(u => u.Contador)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Termo))
            q = q.Where(u => u.Nome.Contains(request.Termo) || u.Email.Contains(request.Termo));

        if (!string.IsNullOrWhiteSpace(request.Perfil))
            q = q.Where(u => u.Perfil.ToString() == request.Perfil);

        if (request.ClienteId is not null)
            q = q.Where(u => u.ClienteId == request.ClienteId);

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderBy(u => u.Nome)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new UsuarioDto(
                u.Id, u.Nome, u.Email, u.Perfil.ToString(), u.Ativo,
                u.ContadorId, u.Contador != null ? u.Contador.Nome : null,
                u.ClienteId, null,
                u.TwoFactorHabilitado, u.CreatedAt, u.UltimoAcessoEm))
            .ToListAsync(ct);

        return Result.Success(PagedResult<UsuarioDto>.Create(items, total, request.Page, request.PageSize));
    }
}
