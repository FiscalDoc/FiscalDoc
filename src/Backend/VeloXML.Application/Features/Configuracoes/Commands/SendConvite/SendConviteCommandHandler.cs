using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Configuracoes.Commands.SendConvite;

public sealed class SendConviteCommandHandler(IEmailService emailService, ICurrentUser currentUser)
    : IRequestHandler<SendConviteCommand, Result>
{
    private const string LinkTesteGratis = "https://fiscaldoc.com.br/#trial";

    public async Task<Result> Handle(SendConviteCommand request, CancellationToken ct)
    {
        var primeiroNome = request.Nome.Split(' ')[0];
        var convidadoPor = currentUser.Name ?? "A equipe FiscalDoc";

        var html = $"""
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

                    <tr><td style="background:#0d0f14;padding:28px 36px;text-align:center">
                      <span style="display:inline-flex;align-items:center;gap:10px">
                        <span style="background:#00e5a0;border-radius:7px;padding:6px 10px;font-size:18px">📄</span>
                        <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.02em">FiscalDoc</span>
                      </span>
                    </td></tr>

                    <tr><td style="padding:36px 36px 28px">
                      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0d0f14">Olá, {primeiroNome}! 👋</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">
                        <strong>{convidadoPor}</strong> convidou você para conhecer o <strong>FiscalDoc</strong>, o hub fiscal que automatiza a recepção, organização e monitoramento de NF-e, CT-e, MDF-e e NFS-e para escritórios de contabilidade.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px">
                        <tr><td style="padding:16px 20px">
                          <span style="font-size:13px;color:#555;line-height:1.6">
                            ✓ 30 dias grátis, sem cartão de crédito<br>
                            ✓ Recepção automática de XMLs por API<br>
                            ✓ Alertas de duplicidade e inconsistência<br>
                            ✓ Multi-cliente em uma única tela
                          </span>
                        </td></tr>
                      </table>

                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
                        <tr><td style="background:#00e5a0;border-radius:8px;text-align:center">
                          <a href="{LinkTesteGratis}" style="display:inline-block;padding:14px 32px;color:#0d0f14;font-size:15px;font-weight:700;text-decoration:none">
                            Começar teste grátis →
                          </a>
                        </td></tr>
                      </table>

                      <p style="margin:0;font-size:13px;color:#888;line-height:1.6">
                        Se você não esperava este e-mail, pode ignorá-lo com segurança.
                      </p>
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

        await emailService.SendAsync(request.Email, "Você foi convidado para conhecer o FiscalDoc", html, ct);

        return Result.Success();
    }
}
