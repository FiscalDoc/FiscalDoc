using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Queries.GetCurrentUser;

public sealed class GetCurrentUserQueryHandler(
    ICurrentUser currentUser,
    IUnitOfWork uow,
    IApplicationDbContext db) : IRequestHandler<GetCurrentUserQuery, Result<UserDto>>
{
    public async Task<Result<UserDto>> Handle(GetCurrentUserQuery request, CancellationToken ct)
    {
        if (currentUser.UserId is null)
            return Result.Failure<UserDto>(ResultError.Unauthorized());

        var user = await uow.Users.GetByIdAsync(currentUser.UserId.Value, ct);
        if (user is null)
            return Result.Failure<UserDto>(ResultError.NotFound("User"));

        var tenant = await db.Tenants.IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, ct);

        DateTime? acessoExpiracao = null;
        if (user.ContadorId.HasValue)
        {
            var contador = await db.Contadores.IgnoreQueryFilters()
                .Where(c => c.Id == user.ContadorId.Value)
                .Select(c => c.DataLimiteAcesso)
                .FirstOrDefaultAsync(ct);
            acessoExpiracao = contador;
        }

        return Result.Success(new UserDto(
            user.Id, user.Nome, user.Email, user.Perfil.ToString(),
            user.TenantId, user.Ativo,
            tenant?.Plano ?? "Starter",
            tenant?.PlanoExpiracao,
            acessoExpiracao
        ));
    }
}
