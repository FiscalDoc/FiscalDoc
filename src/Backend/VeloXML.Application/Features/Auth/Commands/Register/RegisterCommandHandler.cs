using MediatR;
using Microsoft.EntityFrameworkCore;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.Register;

public sealed class RegisterCommandHandler(IApplicationDbContext db)
    : IRequestHandler<RegisterCommand, Result<RegisterResponse>>
{
    public async Task<Result<RegisterResponse>> Handle(RegisterCommand request, CancellationToken ct)
    {
        var emailNorm = request.Email.Trim().ToLowerInvariant();

        var emailExists = await db.Users.IgnoreQueryFilters()
            .AnyAsync(u => u.Email == emailNorm, ct);
        if (emailExists)
            return Result.Failure<RegisterResponse>(ResultError.Conflict("E-mail já cadastrado."));

        var tenant = new Tenant
        {
            Nome           = request.NomeFirma ?? request.Nome,
            Email          = emailNorm,
            Telefone       = request.Telefone,
            Ativo          = true,
            Plano          = "Trial",
            PlanoExpiracao = DateTime.UtcNow.AddDays(30)
        };
        db.Tenants.Add(tenant);

        var contador = new Contador
        {
            TenantId = tenant.Id,
            Nome     = request.Nome,
            Email    = emailNorm,
            Telefone = request.Telefone,
        };
        db.Contadores.Add(contador);

        var user = new User
        {
            TenantId     = tenant.Id,
            Nome         = request.Nome,
            Email        = emailNorm,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil       = PerfilEnum.Contador,
            ContadorId   = contador.Id,
            Ativo        = true
        };
        db.Users.Add(user);

        await db.SaveChangesAsync(ct);

        return Result.Success(new RegisterResponse(tenant.Id, user.Id, user.Nome, user.Email));
    }
}
