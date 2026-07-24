using System.Security.Cryptography;
using System.Text;
using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ResetSenhaContador;

public sealed class ResetSenhaContadorCommandHandler(IUnitOfWork uow)
    : IRequestHandler<ResetSenhaContadorCommand, Result<string>>
{
    public async Task<Result<string>> Handle(ResetSenhaContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null)
            return Result.Failure<string>(ResultError.NotFound("Contador não encontrado."));

        var user = await uow.Users.GetByContadorIdAsync(request.ContadorId, ct);
        if (user is null)
            return Result.Failure<string>(ResultError.NotFound("Usuário do contador não encontrado."));

        var novaSenha = GerarSenhaTemporaria();
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
        await uow.SaveChangesAsync(ct);

        return Result.Success(novaSenha);
    }

    private static string GerarSenhaTemporaria()
    {
        const string upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower   = "abcdefghjkmnpqrstuvwxyz";
        const string digits  = "23456789";
        const string special = "@#!";
        const string all     = upper + lower + digits + special;

        Span<byte> bytes = stackalloc byte[12];
        RandomNumberGenerator.Fill(bytes);

        var sb = new StringBuilder(12);
        for (var i = 0; i < 12; i++)
            sb.Append(all[bytes[i] % all.Length]);

        sb[9]  = upper[bytes[9]  % upper.Length];
        sb[10] = digits[bytes[10] % digits.Length];
        sb[11] = special[bytes[11] % special.Length];

        return sb.ToString();
    }
}
