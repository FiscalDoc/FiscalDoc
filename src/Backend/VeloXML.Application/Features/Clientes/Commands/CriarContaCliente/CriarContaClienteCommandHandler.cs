using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.CriarContaCliente;

public sealed class CriarContaClienteCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ILogger<CriarContaClienteCommandHandler> logger)
    : IRequestHandler<CriarContaClienteCommand, Result<CriarContaClienteResponse>>
{
    public async Task<Result<CriarContaClienteResponse>> Handle(CriarContaClienteCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<CriarContaClienteResponse>(ResultError.NotFound("Cliente não encontrado."));

        var emailNorm = request.Email.Trim().ToLowerInvariant();
        var existing = await uow.Users.GetByEmailAsync(emailNorm, ct);
        if (existing != null)
            return Result.Failure<CriarContaClienteResponse>(
                ResultError.Conflict("Já existe um usuário com este e-mail."));

        var user = new User
        {
            TenantId     = currentUser.TenantId!.Value,
            Nome         = request.Nome,
            Email        = emailNorm,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil       = PerfilEnum.Cliente,
            ClienteId    = request.ClienteId,
            Ativo        = true
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);
        logger.LogInformation("Conta de usuário {UserId} criada para o cliente {ClienteId}", user.Id, request.ClienteId);

        return Result.Success(new CriarContaClienteResponse(user.Id, user.Email, user.Nome));
    }
}
