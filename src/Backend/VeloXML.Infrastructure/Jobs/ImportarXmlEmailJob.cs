using MediatR;
using Microsoft.Extensions.Logging;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MimeKit;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

public sealed class ImportarXmlEmailJob(
    IUnitOfWork uow,
    IMediator mediator,
    ILogger<ImportarXmlEmailJob> logger)
{
    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var clientes = await uow.Clientes.FindAsync(
            c => c.ImapHabilitado && c.ImapHost != null && c.ImapEmail != null && c.ImapSenha != null, ct);

        foreach (var cliente in clientes)
        {
            try
            {
                await ProcessarClienteAsync(cliente.Id, cliente.ImapHost!, cliente.ImapPort,
                    cliente.ImapEmail!, cliente.ImapSenha!, ct);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Erro ao importar e-mails do cliente {ClienteId}", cliente.Id);
            }
        }
    }

    private async Task ProcessarClienteAsync(
        Guid clienteId, string host, int port, string email, string senha, CancellationToken ct)
    {
        using var client = new ImapClient();
        await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.SslOnConnect, ct);
        await client.AuthenticateAsync(email, senha, ct);

        var inbox = client.Inbox;
        await inbox.OpenAsync(FolderAccess.ReadWrite, ct);

        var uids = await inbox.SearchAsync(SearchQuery.NotSeen, ct);
        if (uids.Count == 0)
        {
            await client.DisconnectAsync(true, ct);
            return;
        }

        var messages = await inbox.FetchAsync(uids, MessageSummaryItems.Full | MessageSummaryItems.Body, ct);

        foreach (var summary in messages)
        {
            var message = await inbox.GetMessageAsync(summary.UniqueId, ct);
            var xmlAttachments = message.Attachments
                .OfType<MimePart>()
                .Where(a => a.FileName?.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) == true);

            foreach (var attachment in xmlAttachments)
            {
                await using var stream = new MemoryStream();
                await attachment.Content.DecodeToAsync(stream, ct);
                stream.Position = 0;

                var fileName = attachment.FileName ?? $"email_{summary.UniqueId}.xml";
                var tipo = DetectarTipo(fileName);
                var dto = new FileUploadDto(stream, fileName, "application/xml", stream.Length);

                var result = await mediator.Send(new UploadDocumentoCommand(clienteId, tipo, dto), ct);
                if (result.IsSuccess)
                    logger.LogInformation("XML {File} importado para cliente {ClienteId}", fileName, clienteId);
                else
                    logger.LogWarning("Falha ao importar {File} para cliente {ClienteId}: {Err}",
                        fileName, clienteId, result.Error);
            }

            // Mark as read after processing
            await inbox.AddFlagsAsync(summary.UniqueId, MessageFlags.Seen, true, ct);
        }

        await client.DisconnectAsync(true, ct);
    }

    private static TipoDocumentoEnum DetectarTipo(string fileName)
    {
        var name = fileName.ToUpperInvariant();
        if (name.Contains("NFE") || name.Contains("NF-E")) return TipoDocumentoEnum.NFe;
        if (name.Contains("CTE") || name.Contains("CT-E")) return TipoDocumentoEnum.CTe;
        if (name.Contains("MDFE") || name.Contains("MDF-E")) return TipoDocumentoEnum.MDFe;
        if (name.Contains("NFSE") || name.Contains("NFS-E")) return TipoDocumentoEnum.NFSe;
        return TipoDocumentoEnum.NFe; // default
    }
}
