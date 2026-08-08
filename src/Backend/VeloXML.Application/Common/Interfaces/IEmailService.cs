namespace VeloXML.Application.Common.Interfaces;

public record EmailAttachment(string FileName, byte[] Content, string MimeType);

public interface IEmailService
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, CancellationToken ct = default);
    Task SendAsync(IEnumerable<string> to, string subject, string htmlBody, IEnumerable<EmailAttachment> attachments, CancellationToken ct = default);

    /// <summary>
    /// Envia um e-mail de teste usando os parâmetros informados diretamente (não os
    /// salvos em Configuracoes), para validar uma configuração de SMTP antes de salvá-la.
    /// Lança exceção em caso de falha de conexão/autenticação/envio.
    /// </summary>
    Task TestSmtpAsync(
        string host, int port, string from, string fromName,
        string? username, string? password, bool enableSsl,
        string destinatario, CancellationToken ct = default);
}
