using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Auth;

/// <summary>
/// Compartilhado entre todos os fluxos que emitem um link de definir/redefinir senha:
/// criação de usuário/Contador (primeiro acesso), "esqueci minha senha" e reset de senha de
/// Contador disparado pelo admin. Mesma tabela/mecanismo pros três — só o texto do e-mail muda
/// (primeiroAcesso true/false).
/// </summary>
public static class PrimeiroAcessoHelper
{
    public static string GerarHashInutilizavel(ITokenService tokenService) =>
        BCrypt.Net.BCrypt.HashPassword(tokenService.GenerateRefreshToken());

    public static async Task<string> CriarTokenAsync(IUnitOfWork uow, ITokenService tokenService, User user, CancellationToken ct)
    {
        var ativos = await uow.PasswordResetTokens.GetAtivosPorUsuarioAsync(user.Id, ct);
        foreach (var antigo in ativos)
            antigo.UsedAt = DateTime.UtcNow;

        var token = new PasswordResetToken
        {
            TenantId = user.TenantId,
            UserId = user.Id,
            Token = tokenService.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        };
        await uow.PasswordResetTokens.AddAsync(token, ct);
        return $"https://app.fiscaldoc.com.br/auth/redefinir-senha?token={Uri.EscapeDataString(token.Token)}";
    }

    public static async Task EnviarEmailAsync(
        IEmailService emailService, string nome, string email, string link, bool primeiroAcesso, CancellationToken ct)
    {
        var (assunto, html) = AuthEmailTemplates.DefinirSenha(nome, link, primeiroAcesso);
        try
        {
            await emailService.SendAsync(email, assunto, html, ct);
        }
        catch
        {
            // Falha no e-mail não deve derrubar a operação que disparou o envio.
        }
    }
}
