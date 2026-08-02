using System.IO.Compression;
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
        Guid ClienteId, string ClienteNome, Guid TenantId, Guid? ContadorId, DateTime ExecutadoEm,
        int EmailsEncontrados, int XmlsProcessados, int XmlsImportados, int Erros, string? MensagemErro,
        List<Guid> DocumentoIds);

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

        await SalvarStatusExecucaoAsync(concluidoEm, clientes.Count, totalEmails, totalProcessados, totalImportados, totalErros, resumos, ct);
    }

    private async Task SalvarStatusExecucaoAsync(
        DateTime executadoEm, int clientesProcessados, int emailsEncontrados,
        int xmlsProcessados, int xmlsImportados, int erros, List<ResumoCliente> resumos, CancellationToken ct)
    {
        // O job roda em background (Hangfire), sem usuário logado pra derivar o tenant
        // automaticamente — usamos o tenant de qualquer cliente processado como dono do
        // registro de status "global". Sem nenhum cliente processado, não há como saber
        // de qual tenant é esse status, então a gravação é pulada (nada de novo a mostrar mesmo).
        var tenantId = resumos.Count > 0 ? resumos[0].TenantId : (Guid?)null;
        if (tenantId is null)
        {
            logger.LogInformation("[ImportarXmlEmail] Nenhum cliente com IMAP habilitado — status da execução não será salvo.");
            return;
        }

        try
        {
            var clientesDto = resumos.Select(r => new ImportacaoXmlClienteStatusDto(
                r.ClienteId, r.ClienteNome, r.EmailsEncontrados, r.XmlsProcessados, r.XmlsImportados, r.Erros,
                // Trunca mensagens de exceção muito longas — é só um resumo de diagnóstico rápido.
                // O histórico completo (sem truncar) fica gravado em ImportacaoXmlLogs, abaixo.
                r.MensagemErro is { Length: > 500 } ? r.MensagemErro[..500] + "…" : r.MensagemErro))
                .ToList();

            var status = new ImportacaoXmlStatusDto(
                executadoEm, clientesProcessados, emailsEncontrados, xmlsProcessados, xmlsImportados, erros, clientesDto);
            var json = JsonSerializer.Serialize(status);
            await uow.Configuracoes.UpsertAsync(
                GetImportacaoXmlStatusQueryHandler.ChaveConfiguracao, json,
                "Resumo da última execução do robô de importação de XML por e-mail", ct, tenantId);

            foreach (var r in resumos)
            {
                await uow.ImportacaoXmlLogs.AddAsync(new ImportacaoXmlLog
                {
                    TenantId = r.TenantId,
                    ContadorId = r.ContadorId,
                    Origem = OrigemImportacaoEnum.ImportacaoEmail,
                    ExecutadoEm = executadoEm,
                    ClienteId = r.ClienteId,
                    ClienteNome = r.ClienteNome,
                    EmailsEncontrados = r.EmailsEncontrados,
                    XmlsProcessados = r.XmlsProcessados,
                    XmlsImportados = r.XmlsImportados,
                    Erros = r.Erros,
                    MensagemErro = r.MensagemErro,
                    DocumentoIds = r.DocumentoIds,
                }, ct);
            }

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
        var documentoIds = new List<Guid>();

        try
        {
            using var client = new ImapClient();

            // O container só tem rota de saída IPv6 pra domínios como o do Hostinger, e o
            // responder de CRL/OCSP usado pra checar revogação do certificado não é alcançável
            // por ali — o handshake TLS em si valida certinho (confirmado via openssl s_client),
            // só a checagem de revogação trava. Desliga só a checagem de revogação; a validação
            // de cadeia/identidade do certificado continua normal.
            client.CheckCertificateRevocation = false;

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
                    var attachments = message.Attachments.OfType<MimePart>().ToList();
                    var assunto = summary.Envelope?.Subject ?? "(sem assunto)";

                    foreach (var attachment in attachments)
                    {
                        var fileName = attachment.FileName ?? $"email_{summary.UniqueId}";

                        if (fileName.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
                        {
                            xmlsProcessados++;
                            await using var stream = new MemoryStream();
                            await attachment.Content.DecodeToAsync(stream, ct);
                            stream.Position = 0;

                            var docId = await ImportarXmlAsync(cliente, assunto, fileName, stream, ct);
                            if (docId.HasValue)
                            {
                                xmlsImportados++;
                                documentoIds.Add(docId.Value);
                            }
                            else
                                erros++;
                        }
                        else if (fileName.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                        {
                            await using var zipStream = new MemoryStream();
                            await attachment.Content.DecodeToAsync(zipStream, ct);
                            zipStream.Position = 0;

                            using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);
                            foreach (var entry in archive.Entries)
                            {
                                if (!entry.Name.EndsWith(".xml", StringComparison.OrdinalIgnoreCase))
                                    continue;

                                xmlsProcessados++;
                                await using var entryStream = new MemoryStream();
                                await using (var entryContent = entry.Open())
                                    await entryContent.CopyToAsync(entryStream, ct);
                                entryStream.Position = 0;

                                var entryDocId = await ImportarXmlAsync(cliente, assunto, entry.Name, entryStream, ct);
                                if (entryDocId.HasValue)
                                {
                                    xmlsImportados++;
                                    documentoIds.Add(entryDocId.Value);
                                }
                                else
                                    erros++;
                            }
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

        return new ResumoCliente(cliente.Id, cliente.RazaoSocial, cliente.TenantId, cliente.ContadorId, executadoEm,
            emailsEncontrados, xmlsProcessados, xmlsImportados, erros, mensagemErro, documentoIds);
    }

    private async Task<Guid?> ImportarXmlAsync(Cliente cliente, string assunto, string fileName, Stream stream, CancellationToken ct)
    {
        var tipo = DetectarTipo(fileName);
        var dto = new FileUploadDto(stream, fileName, "application/xml", stream.Length);

        var result = await mediator.Send(new UploadDocumentoCommand(cliente.Id, tipo, dto, OrigemImportacaoEnum.ImportacaoEmail), ct);
        if (result.IsSuccess)
        {
            logger.LogInformation(
                "[ImportarXmlEmail] XML importado com sucesso | Cliente={ClienteId} ({ClienteNome}) | E-mail={EmailAssunto} | Arquivo={Arquivo} | Tipo={Tipo}",
                cliente.Id, cliente.RazaoSocial, assunto, fileName, tipo);
            return result.Value.Id;
        }

        logger.LogWarning(
            "[ImportarXmlEmail] Falha ao importar XML | Cliente={ClienteId} ({ClienteNome}) | E-mail={EmailAssunto} | Arquivo={Arquivo} | Motivo={Motivo}",
            cliente.Id, cliente.RazaoSocial, assunto, fileName, result.Error.Description);
        return null;
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
