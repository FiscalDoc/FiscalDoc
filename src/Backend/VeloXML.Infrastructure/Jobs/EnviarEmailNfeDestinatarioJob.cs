using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

// Disparado (via IBackgroundJobDispatcher/Hangfire) quando a configuração de e-mail
// automático do Cliente (Cliente.EmailNfeDestinatarioHabilitado/Gatilho) manda notificar o
// destinatário — seja no gatilho "NotaFiscal" (só quando já existe XML de verdade) ou
// "Pedido" (qualquer emissão, mesmo sem XML — nesse caso o e-mail sai sem anexo). Job em vez
// de envio inline pra ter retry automático do Hangfire se o SMTP falhar transitoriamente.
public sealed class EnviarEmailNfeDestinatarioJob(
    IUnitOfWork uow, IStorageService storage, IEmailService email, ILogger<EnviarEmailNfeDestinatarioJob> logger)
{
    public const string TipoSucesso = "EmailNfeEnviado";
    public const string TipoFalha   = "EmailNfeFalhou";

    public async Task ExecuteAsync(Guid pedidoId, CancellationToken ct = default)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(pedidoId, ct);
        if (pedido is null) return;

        var destinatario = await uow.Destinatarios.GetByIdAsync(pedido.DestinatarioId, ct);
        if (string.IsNullOrWhiteSpace(destinatario?.Email))
        {
            logger.LogInformation("Pedido {PedidoId}: destinatário sem e-mail cadastrado — notificação não enviada.", pedidoId);
            return;
        }

        var cliente = await uow.Clientes.GetByIdAsync(pedido.ClienteId, ct);
        if (cliente is null || !cliente.EmailNfeDestinatarioHabilitado) return;

        var attachments = new List<EmailAttachment>();
        string? chaveAcesso = null;

        if (pedido.DocumentoId is Guid documentoId)
        {
            var documento = await uow.Documentos.GetByIdAsync(documentoId, ct);
            chaveAcesso = documento?.ChaveAcesso;

            var arquivos = await uow.Arquivos.GetByDocumentoAsync(documentoId, ct);
            foreach (var arquivo in arquivos.Where(a =>
                (a.MimeType is "application/xml" or "application/pdf") &&
                !a.NomeOriginal.Contains("cancelamento", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    await using var stream = await storage.DownloadAsync(arquivo.ObjectKey, arquivo.Bucket, ct);
                    using var ms = new MemoryStream();
                    await stream.CopyToAsync(ms, ct);
                    attachments.Add(new EmailAttachment(arquivo.NomeOriginal, ms.ToArray(), arquivo.MimeType));
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Falha ao baixar anexo {ObjectKey} do documento {DocumentoId} pra e-mail do destinatário.", arquivo.ObjectKey, documentoId);
                }
            }
        }

        // Gatilho "NotaFiscal" exige XML de verdade — se não achou nenhum anexo XML, não havia
        // nota autorizada ainda nesse momento (corrida entre o job e a gravação do Documento,
        // por exemplo), então não faz sentido mandar um e-mail de "nota fiscal" vazio.
        if (cliente.EmailNfeDestinatarioGatilho == "NotaFiscal" && attachments.Count == 0)
        {
            logger.LogInformation("Pedido {PedidoId}: gatilho é NotaFiscal mas não há XML disponível ainda — notificação adiada/ignorada.", pedidoId);
            return;
        }

        var assunto = chaveAcesso is not null
            ? $"NF-e nº {pedido.Numero} — {cliente.RazaoSocial}"
            : $"Pedido nº {pedido.Numero} — {cliente.RazaoSocial}";

        var corpo = chaveAcesso is not null
            ? $"""
               <p>Olá, {System.Net.WebUtility.HtmlEncode(destinatario.RazaoSocial)}!</p>
               <p>Segue em anexo o XML{(attachments.Count > 1 ? " e o DANFE em PDF" : "")} da nota fiscal referente ao pedido nº {pedido.Numero}.</p>
               <p>Chave de acesso: {chaveAcesso}</p>
               <p>{System.Net.WebUtility.HtmlEncode(cliente.RazaoSocial)}</p>
               """
            : $"""
               <p>Olá, {System.Net.WebUtility.HtmlEncode(destinatario.RazaoSocial)}!</p>
               <p>Seu pedido nº {pedido.Numero} foi emitido.</p>
               <p>{System.Net.WebUtility.HtmlEncode(cliente.RazaoSocial)}</p>
               """;

        try
        {
            await email.SendAsync([destinatario.Email], assunto, corpo, attachments, ct);

            await RegistrarHistoricoAsync(pedido, TipoSucesso,
                $"E-mail da {(chaveAcesso is not null ? "NF-e" : "notificação de pedido")} enviado para {destinatario.Email}.", ct);

            logger.LogInformation("E-mail de NF-e do pedido {PedidoId} enviado para {Email}.", pedidoId, destinatario.Email);
        }
        catch (Exception ex)
        {
            await RegistrarHistoricoAsync(pedido, TipoFalha,
                $"Falha ao enviar e-mail para {destinatario.Email}: {Truncar(ex.Message, 800)}", ct);

            logger.LogError(ex, "Falha ao enviar e-mail de NF-e do pedido {PedidoId} para {Email}.", pedidoId, destinatario.Email);

            // Sobe pro Hangfire tratar como falha e reagendar a tentativa automaticamente
            // (retry padrão), além de deixar disponível o botão manual "Tentar novamente".
            throw;
        }
    }

    private async Task RegistrarHistoricoAsync(Domain.Entities.Pedido pedido, string tipo, string descricao, CancellationToken ct)
    {
        await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
        {
            TenantId    = pedido.TenantId,
            PedidoId    = pedido.Id,
            Tipo        = tipo,
            Descricao   = descricao,
            UsuarioNome = "FiscalDoc",
        }, ct);
        await uow.SaveChangesAsync(ct);
    }

    private static string Truncar(string texto, int tamanho) =>
        texto.Length <= tamanho ? texto : texto[..tamanho] + "…";
}
