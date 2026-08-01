using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ResetSenhaContador;

public sealed class ResetSenhaContadorCommandHandler(
    IUnitOfWork uow, ITokenService tokenService, IEmailService emailService)
    : IRequestHandler<ResetSenhaContadorCommand, Result>
{
    public async Task<Result> Handle(ResetSenhaContadorCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null)
            return Result.Failure(ResultError.NotFound("Contador não encontrado."));

        var user = await uow.Users.GetByContadorIdAsync(request.ContadorId, ct);
        if (user is null)
            return Result.Failure(ResultError.NotFound("Usuário do contador não encontrado."));

        var link = await PrimeiroAcessoHelper.CriarTokenAsync(uow, tokenService, user, ct);
        await uow.SaveChangesAsync(ct);
        await PrimeiroAcessoHelper.EnviarEmailAsync(emailService, user.Nome, user.Email, link, primeiroAcesso: false, ct);

        return Result.Success();
    }
}
