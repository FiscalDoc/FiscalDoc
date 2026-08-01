using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Auth.Commands.ForgotPassword;

public sealed class ForgotPasswordCommandHandler(
    IUnitOfWork uow,
    ITokenService tokenService,
    IEmailService emailService) : IRequestHandler<ForgotPasswordCommand, Result>
{
    public async Task<Result> Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        // Sempre retorna sucesso, exista ou não o e-mail — evita que alguém descubra quais
        // e-mails estão cadastrados só testando esse endpoint. O envio (ou não) do e-mail é o
        // único efeito colateral que muda.
        var user = await uow.Users.GetByEmailAsync(request.Email, ct);
        if (user is not null && user.Ativo)
        {
            var link = await PrimeiroAcessoHelper.CriarTokenAsync(uow, tokenService, user, ct);
            await uow.SaveChangesAsync(ct);
            await PrimeiroAcessoHelper.EnviarEmailAsync(emailService, user.Nome, user.Email, link, primeiroAcesso: false, ct);
        }

        return Result.Success();
    }
}
