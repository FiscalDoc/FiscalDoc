using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Commands.ResendBoasVindas;

public sealed class ResendBoasVindasCommandHandler(IUnitOfWork uow, IEmailService emailService)
    : IRequestHandler<ResendBoasVindasCommand, Result<bool>>
{
    public async Task<Result<bool>> Handle(ResendBoasVindasCommand request, CancellationToken ct)
    {
        var contador = await uow.Contadores.GetByIdAsync(request.ContadorId, ct);
        if (contador is null)
            return Result.Failure<bool>(ResultError.NotFound("Contador não encontrado."));

        var primeiroNome = contador.Nome.Split(' ')[0];
        var html = $"""
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
                    <tr><td style="background:#0d0f14;padding:28px 36px;text-align:center">
                      <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.02em">📄 FiscalDoc</span>
                    </td></tr>
                    <tr><td style="padding:36px 36px 28px">
                      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0d0f14">Olá, {primeiroNome}!</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
                        Conforme solicitado, estamos reenviando as informações de acesso ao <strong>FiscalDoc</strong>.<br>
                        Use o e-mail abaixo para entrar no sistema.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
                        <tr><td style="padding:16px 20px">
                          <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#888">E-mail de acesso</span><br>
                          <span style="font-size:15px;font-weight:600;color:#0d0f14">{contador.Email}</span>
                        </td></tr>
                      </table>
                      <p style="margin:0 0 24px;font-size:13px;color:#555;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px">
                        🔑 Se você não lembra sua senha, use a opção <strong>"Esqueci minha senha"</strong> na tela de login, ou entre em contato com o administrador para gerar uma nova.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
                        <tr><td style="background:#00e5a0;border-radius:8px;text-align:center">
                          <a href="http://app.fiscaldoc.com.br/auth/login" style="display:inline-block;padding:14px 32px;color:#0d0f14;font-size:15px;font-weight:700;text-decoration:none">
                            Acessar o FiscalDoc →
                          </a>
                        </td></tr>
                      </table>
                    </td></tr>
                    <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center">
                      <p style="margin:0;font-size:12px;color:#aaa">© {DateTime.UtcNow.Year} FiscalDoc · Hub Fiscal para Contadores</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        await emailService.SendAsync(contador.Email, "FiscalDoc — Suas informações de acesso", html, ct);
        return Result.Success(true);
    }
}
