using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.SwitchContext;

public sealed class SwitchContextCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ITokenService tokenService, ILogger<SwitchContextCommandHandler> logger)
    : IRequestHandler<SwitchContextCommand, Result<SwitchContextResponse>>
{
    public async Task<Result<SwitchContextResponse>> Handle(SwitchContextCommand request, CancellationToken ct)
    {
        // Só um Administrador real (não já impersonando outro contexto) pode trocar de contexto —
        // evita encadear impersonação a partir de uma sessão já impersonada.
        if (currentUser.Role != nameof(PerfilEnum.Administrador) || currentUser.ActingAdminId.HasValue)
            return Result.Failure<SwitchContextResponse>(ResultError.Unauthorized());

        if (!Enum.TryParse<PerfilEnum>(request.Perfil, ignoreCase: true, out var perfil)
            || perfil is not (PerfilEnum.Contador or PerfilEnum.Cliente))
            return Result.Failure<SwitchContextResponse>(ResultError.Validation("Perfil", "Perfil inválido — escolha Contador ou Cliente."));

        Contador? contador = null;
        Cliente? cliente = null;

        if (perfil == PerfilEnum.Cliente)
        {
            if (request.ClienteId is null)
                return Result.Failure<SwitchContextResponse>(ResultError.Validation("ClienteId", "Selecione o cliente."));

            cliente = await uow.Clientes.GetByIdAsync(request.ClienteId.Value, ct);
            if (cliente is null)
                return Result.Failure<SwitchContextResponse>(ResultError.NotFound("Cliente"));

            // Contador sempre derivado do próprio Cliente — o Admin seleciona o Cliente
            // diretamente, sem precisar escolher o Contador antes. Um Cliente cadastrado
            // direto pelo Administrador (sem Contador) simplesmente não tem um pra carregar.
            if (cliente.ContadorId.HasValue)
            {
                contador = await uow.Contadores.GetByIdAsync(cliente.ContadorId.Value, ct);
                if (contador is null)
                    return Result.Failure<SwitchContextResponse>(ResultError.NotFound("Contador"));
            }
        }
        else
        {
            if (request.ContadorId is null)
                return Result.Failure<SwitchContextResponse>(ResultError.Validation("ContadorId", "Selecione o contador."));

            contador = await uow.Contadores.GetByIdAsync(request.ContadorId.Value, ct);
            if (contador is null)
                return Result.Failure<SwitchContextResponse>(ResultError.NotFound("Contador"));
        }

        var admin = await uow.Users.GetByIdAsync(currentUser.UserId!.Value, ct);
        if (admin is null)
            return Result.Failure<SwitchContextResponse>(ResultError.Unauthorized());

        var tenantId = contador?.TenantId ?? cliente!.TenantId;
        var empresa = contador is not null ? (contador.Empresa ?? contador.Nome) : (cliente!.NomeFantasia ?? cliente.RazaoSocial);
        var accessToken = tokenService.GenerateContextToken(
            admin, perfil.ToString(), tenantId, contador?.Id, cliente?.Id, empresa);

        logger.LogInformation(
            "[SwitchContext] Admin {AdminId} ({AdminEmail}) passou a atuar como {Perfil} — Contador {ContadorId} ({Empresa}){ClienteInfo}",
            admin.Id, admin.Email, perfil, contador?.Id, empresa,
            cliente is not null ? $" | Cliente {cliente.Id} ({cliente.RazaoSocial})" : "");

        return Result.Success(new SwitchContextResponse(accessToken, DateTime.UtcNow.AddMinutes(60), perfil.ToString(), empresa));
    }
}
