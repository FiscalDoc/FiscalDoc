using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Search;
using MimeKit;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Configuracoes.Queries.GetImportacaoXmlStatus;
using VeloXML.Application.Features.Documentos.Commands.UploadDocumento;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

public sealed class ImportarXmlEmailJob(
    IUnitOfWork uow,
    IMediator mediator,
    ILogger<ImportarXmlEmailJob> logger)
{
    public const string JobId = "importar-xml-email";

    private sealed record ResumoCliente(
        Guid ClienteId, string ClienteNome, DateTime ExecutadoEm,
        int EmailsEncontrados, int XmlsProcessados, int XmlsImportados, int Erros, string? MensagemErro);

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var inicioExecucao = DateTime.UtcNow;

        var clientes = await uow.Clientes.FindAsync(
            c => c.ImapHabilitado && c.ImapHost != null && c.ImapEmail != null && c.ImapSenha != null, ct);

        logger.LogInformation(
            "[ImportarXmlEmail] Execução iniciada em {IniciadoEm:u} | Clientes com IMAP habilitado: {TotalClientes}",
            inicioExecucao, clientes.Count);

        var resumos = new List<ResumoCliente>(clientes.Count);
        foreach (var cliente in clientes)
            resumos.Add(await ProcessarClienteAsync(cliente, ct));

        var duracaoMs = (DateTime.UtcNow - inicioExecucao).TotalMilliseconds;
        var totalEmails = resumos.Sum(r => r.EmailsEncontrados);
        var totalProcessados = resumos.Sum(r => r.XmlsProcessados);
        var totalImportados = resumos.Sum(r => r.XmlsImportados);
        var totalErros = resumos.Sum(r => r.Erros);

        var nivelFinal = totalErros > 0 ? LogLevel.Warning : LogLevel.Information;
        var concluidoEm = DateTime.UtcNow;
        logger.Log(nivelFinal,
            "[ImportarXmlEmail] Execução concluída em {ConcluidoEm:u} (duração: {DuracaoMs:N0}ms) | " +
            "Clientes processados: {TotalClientes} | E-mails encontrados: {TotalEmails} | " +
            "XMLs processados: {TotalProcessados} | XMLs importados com sucesso: {TotalImportados} | Erros: {TotalErros}",
            concluidoEm, duracaoMs, clientes.Count, totalEmails, totalProcessados, totalImportados, totalErros);

        await SalvarStatusExecucaoAsync(concluidoEm, clientes.Count, totalEmails, totalProcessados, totalImportados, totalErros, ct);
    }

    private async Task SalvarStatusExecucaoAsync(
        DateTime executadoEm, int clientesProcessados, int emailsEncontrados,
        int xmlsProcessados, int xmlsImportados, int erros, CancellationToken ct)
    {
        try
        {
            var status = new ImportacaoXmlStatusDto(
                executadoEm, clientesProcessados, emailsEncontrados, xmlsProcessados, xmlsImportados, erros);
            var json = JsonSerializer.Serialize(status);
            await uow.Configuracoes.UpsertAsync(
                GetImportacaoXmlStatusQueryHandler.ChaveConfiguracao, json,
                "Resumo da última execução do robô de importação de XML por e-mail", ct);
            await uow.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "[ImportarXmlEmail] Falha ao salvar o status da última execução.");
        }
    }

    private async Task<ResumoCliente> ProcessarClienteAsync(Cliente cliente, CancellationToken ct)
    {
        var emailsEncontrados = 0;
        var xmlsProcessados = 0;
        var xmlsImportados = 0;
        var erros = 0;
        string? mensagemErro = null;

        try
        {
            using var client = new ImapClient();
            await client.ConnectAsync(cliente.ImapHost!, cliente.ImapPort, MailKit.Security.SecureSocketOptions.SslOnConnect, ct);
            await client.AuthenticateAsync(cliente.ImapEmail!, cliente.ImapSenha!, ct);

            var inbox = client.Inbox;
            await inbox.OpenAsync(FolderAccess.ReadWrite, ct);

            var uids = await inbox.SearchAsync(SearchQuery.NotSeen, ct);
            emailsEncontrados = uids.Count;

            if (uids.Count > 0)
            {
                var messages = await inbox.FetchAsync(uids, MessageSummaryItems.Full | MessageSummaryItems.Body, ct);

                foreach (var summary in messages)
                {
                    var message = await inbox.GetMessageAsync(summary.UniqueId, ct);
                    var xmlAttachments = message.Attachments
                        .OfType<MimePart>()
                        .Where(a => a.FileName?.EndsWith(".xml", StringComparison.OrdinalIgnoreCase) == true)
                        .ToList();

                    foreach (var attachment in xmlAttachments)
                    {
                        xmlsProcessados++;
                        await using var stream = new MemoryStream();
                        await attachment.Content.DecodeToAsync(stream, ct);
                        stream.Position = 0;

                        var fileName = attachment.FileName ?? $"email_{summary.UniqueId}.xml";
                        var tipo = DetectarTipo(fileName);
                        var dto = new FileUploadDto(stream, fileName, "application/xml", stream.Length);

                        var result = await mediator.Send(new UploadDocumentoCommand(cliente.Id, tipo, dto), ct);
                        if (result.IsSuccess)
                        {
                            xmlsImportados++;
                            logger.LogInformation(
                                "[ImportarXmlEmail] XML importado com sucesso | Cliente={ClienteId} ({ClienteNome}) | E-mail={EmailAssunto} | Arquivo={Arquivo} | Tipo={Tipo}",
                                cliente.Id, cliente.RazaoSocial, summary.Envelope?.Subject ?? "(sem assunto)", fileName, tipo);
                        }
                        else
                        {
                            erros++;
                            logger.LogWarning(
                                "[ImportarXmlEmail] Falha ao importar XML | Cliente={ClienteId} ({ClienteNome}) | E-mail={EmailAssunto} | Arquivo={Arquivo} | Motivo={Motivo}",
                                cliente.Id, cliente.RazaoSocial, summary.Envelope?.Subject ?? "(sem assunto)", fileName, result.Error.Description);
                        }
                    }

                    await inbox.AddFlagsAsync(summary.UniqueId, MessageFlags.Seen, true, ct);
                }
            }

            await client.DisconnectAsync(true, ct);
        }
        catch (Exception ex)
        {
            erros++;
            mensagemErro = ex.Message;
            logger.LogError(ex,
                "[ImportarXmlEmail] Erro ao processar e-mails do cliente {ClienteId} ({ClienteNome})",
                cliente.Id, cliente.RazaoSocial);
        }

        var executadoEm = DateTime.UtcNow;
        var nivel = mensagemErro is not null ? LogLevel.Error : erros > 0 ? LogLevel.Warning : LogLevel.Information;

        logger.Log(nivel,
            "[ImportarXmlEmail] Resumo do cliente | Cliente={ClienteId} ({ClienteNome}) | ExecutadoEm={ExecutadoEm:u} | " +
            "EmailsEncontrados={EmailsEncontrados} | XmlsProcessados={XmlsProcessados} | XmlsImportados={XmlsImportados} | " +
            "Erros={Erros} | MensagemErro={MensagemErro}",
            cliente.Id, cliente.RazaoSocial, executadoEm, emailsEncontrados, xmlsProcessados, xmlsImportados, erros,
            mensagemErro ?? "nenhum");

        return new ResumoCliente(cliente.Id, cliente.RazaoSocial, executadoEm,
            emailsEncontrados, xmlsProcessados, xmlsImportados, erros, mensagemErro);
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
