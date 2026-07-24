using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Commands.CriarContaCliente;

public sealed class CriarContaClienteCommandHandler(IUnitOfWork uow, ICurrentTenant tenant)
    : IRequestHandler<CriarContaClienteCommand, Result<CriarContaClienteResponse>>
{
    public async Task<Result<CriarContaClienteResponse>> Handle(CriarContaClienteCommand request, CancellationToken ct)
    {
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<CriarContaClienteResponse>(ResultError.NotFound("Cliente não encontrado."));

        var existing = await uow.Users.GetByEmailAsync(request.Email, ct);
        if (existing != null)
            return Result.Failure<CriarContaClienteResponse>(
                ResultError.Conflict("Já existe um usuário com este e-mail."));

        var user = new User
        {
            TenantId     = tenant.TenantId!.Value,
            Nome         = request.Nome,
            Email        = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Senha),
            Perfil       = PerfilEnum.Cliente,
            ClienteId    = request.ClienteId,
            Ativo        = true
        };

        await uow.Users.AddAsync(user, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(new CriarContaClienteResponse(user.Id, user.Email, user.Nome));
    }
}
