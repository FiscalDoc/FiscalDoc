using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Auth;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Usuarios.Commands.ResetSenhaClienteUsuario;

// Mesmo mecanismo do ResetSenhaContadorCommand — gera um link de definição de senha (1h) e
// manda por e-mail pro usuário; ninguém digita a senha nova nessa tela, só o próprio dono da
// conta define via esse link.
public sealed class ResetSenhaClienteUsuarioCommandHandler(
    IUnitOfWork uow, ICurrentUser currentUser, ITokenService tokenService, IEmailService emailService)
    : IRequestHandler<ResetSenhaClienteUsuarioCommand, Result>
{
    public async Task<Result> Handle(ResetSenhaClienteUsuarioCommand request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure(ResultError.Unauthorized("Você não tem permissão para alterar usuários deste cliente."));

        var alvo = await uow.Users.GetByIdAsync(request.Id, ct);
        if (alvo is null || alvo.ClienteId != request.ClienteId)
            return Result.Failure(ResultError.NotFound("Usuário"));

        var link = await PrimeiroAcessoHelper.CriarTokenAsync(uow, tokenService, alvo, ct);
        await uow.SaveChangesAsync(ct);
        await PrimeiroAcessoHelper.EnviarEmailAsync(emailService, alvo.Nome, alvo.Email, link, primeiroAcesso: false, ct);

        return Result.Success();
    }
}
