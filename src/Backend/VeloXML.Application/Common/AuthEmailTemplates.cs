namespace VeloXML.Application.Common;

/// <summary>
/// E-mails de definição/redefinição de senha (primeiro acesso e "esqueci minha senha") — mesmo
/// link de ação nos dois casos (ResetPasswordCommand não distingue a origem), só muda o texto
/// de introdução e o assunto. Mesmo estilo visual já usado em CreateContadorCommandHandler.
/// </summary>
public static class AuthEmailTemplates
{
    public static (string Subject, string Html) DefinirSenha(string nome, string linkAcao, bool primeiroAcesso)
    {
        var primeiroNome = nome.Split(' ')[0];
        var assunto = primeiroAcesso ? "Bem-vindo ao FiscalDoc — defina sua senha" : "Redefinição de senha — FiscalDoc";
        var titulo = primeiroAcesso ? $"Bem-vindo, {primeiroNome}! 👋" : $"Olá, {primeiroNome}";
        var intro = primeiroAcesso
            ? "Seu acesso ao <strong>FiscalDoc</strong> foi criado. Clique no botão abaixo para definir sua senha e acessar o sistema pela primeira vez."
            : "Recebemos um pedido para redefinir a senha da sua conta no <strong>FiscalDoc</strong>. Clique no botão abaixo para escolher uma nova senha.";
        var botaoLabel = primeiroAcesso ? "Definir minha senha →" : "Redefinir minha senha →";

        var html = $"""
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

                    <!-- Header -->
                    <tr><td style="background:#0d0f14;padding:28px 36px;text-align:center">
                      <span style="display:inline-flex;align-items:center;gap:10px">
                        <span style="background:#00e5a0;border-radius:7px;padding:6px 10px;font-size:18px">📄</span>
                        <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.02em">FiscalDoc</span>
                      </span>
                    </td></tr>

                    <!-- Body -->
                    <tr><td style="padding:36px 36px 28px">
                      <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0d0f14">{titulo}</p>
                      <p style="margin:0 0 24px;font-size:15px;color:#555;line-height:1.6">{intro}</p>

                      <!-- CTA -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px">
                        <tr><td style="background:#00e5a0;border-radius:8px;text-align:center">
                          <a href="{linkAcao}" style="display:inline-block;padding:14px 32px;color:#0d0f14;font-size:15px;font-weight:700;text-decoration:none">
                            {botaoLabel}
                          </a>
                        </td></tr>
                      </table>

                      <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.6">
                        Este link expira em 1 hora. Se você não pediu isso, pode ignorar este e-mail com segurança.
                      </p>
                      <p style="margin:0;font-size:12px;color:#aaa;line-height:1.6;word-break:break-all">
                        Ou copie e cole no navegador: {linkAcao}
                      </p>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 36px;text-align:center">
                      <p style="margin:0;font-size:12px;color:#aaa">© {DateTime.UtcNow.Year} FiscalDoc · Hub Fiscal para Contadores</p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;

        return (assunto, html);
    }
}
