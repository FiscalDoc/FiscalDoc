using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Email;

public sealed class MailPitEmailService(IOptions<EmailOptions> opts, IUnitOfWork uow) : IEmailService
{
    private readonly EmailOptions _opts = opts.Value;

    public Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
        => SendAsync([to], subject, htmlBody, ct);

    public async Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var (host, port, from, fromName, username, password, enableSsl) = await ResolveSmtpAsync(ct);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl   = enableSsl,
            Credentials = username is null ? null : new NetworkCredential(username, password),
        };

        using var msg = new MailMessage
        {
            From            = new MailAddress(from, fromName),
            Subject         = subject,
            Body            = htmlBody,
            IsBodyHtml      = true,
            SubjectEncoding = System.Text.Encoding.UTF8,
            BodyEncoding    = System.Text.Encoding.UTF8,
            HeadersEncoding = System.Text.Encoding.UTF8,
        };

        foreach (var address in to)
            msg.To.Add(address);

        await client.SendMailAsync(msg, ct);
    }

    public async Task TestSmtpAsync(
        string host, int port, string from, string fromName,
        string? username, string? password, bool enableSsl,
        string destinatario, CancellationToken ct = default)
    {
        using var client = new SmtpClient(host, port)
        {
            EnableSsl   = enableSsl,
            Credentials = string.IsNullOrWhiteSpace(username) ? null : new NetworkCredential(username, password),
            Timeout     = 15000,
        };

        using var msg = new MailMessage
        {
            From            = new MailAddress(from, fromName),
            Subject         = "FiscalDoc — Teste de configuração de SMTP",
            Body            = "Se você recebeu este e-mail, a configuração de SMTP do FiscalDoc está funcionando corretamente.",
            SubjectEncoding = System.Text.Encoding.UTF8,
            BodyEncoding    = System.Text.Encoding.UTF8,
        };
        msg.To.Add(destinatario);

        await client.SendMailAsync(msg, ct);
    }

    private async Task<(string host, int port, string from, string fromName, string? username, string? password, bool enableSsl)>
        ResolveSmtpAsync(CancellationToken ct)
    {
        try
        {
            var keys = await uow.Configuracoes.GetByPrefixoAsync("smtp.", ct);
            string Get(string k) => keys.FirstOrDefault(x => x.Chave == k)?.Valor ?? string.Empty;

            var host = Get("smtp.host");
            if (!string.IsNullOrWhiteSpace(host))
            {
                return (
                    host,
                    int.TryParse(Get("smtp.port"), out var p) ? p : _opts.Port,
                    Get("smtp.from").Length > 0 ? Get("smtp.from") : _opts.From,
                    Get("smtp.from_name").Length > 0 ? Get("smtp.from_name") : "FiscalDoc",
                    Get("smtp.username").Length > 0 ? Get("smtp.username") : _opts.Username,
                    Get("smtp.password").Length > 0 ? Get("smtp.password") : _opts.Password,
                    Get("smtp.ssl") == "true"
                );
            }
        }
        catch
        {
            // Fall through to static options if DB is unavailable
        }

        return (_opts.Host, _opts.Port, _opts.From, "FiscalDoc", _opts.Username, _opts.Password, false);
    }
}
