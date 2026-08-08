using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

// Disparado (via IBackgroundJobDispatcher/Hangfire) sempre que um Pedido com TransportadoraId
// definido ganha uma NF-e autorizada de verdade — envia o XML da nota pro webhook cadastrado
// na Transportadora. Roda como job do Hangfire (não inline no request) justamente pra ter
// retry automático se o endpoint do transportador estiver fora do ar: uma exceção não
// tratada aqui faz o Hangfire re-agendar a tentativa sozinho.
public sealed class TransportadoraWebhookJob(
    IUnitOfWork uow, IStorageService storage, IHttpClientFactory httpFactory, ILogger<TransportadoraWebhookJob> logger)
{
    // Tipos gravados em PedidoHistorico pra aparecerem na timeline do pedido — o frontend usa
    // esses nomes pra saber quando mostrar o botão "Tentar novamente" e o link "Ver detalhes".
    public const string TipoSucesso = "WebhookTransportadoraEnviado";
    public const string TipoFalha   = "WebhookTransportadoraFalhou";

    public async Task ExecuteAsync(Guid pedidoId, CancellationToken ct = default)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(pedidoId, ct);
        if (pedido?.TransportadoraId is not Guid transportadoraId || pedido.DocumentoId is not Guid documentoId)
        {
            logger.LogInformation("Pedido {PedidoId} sem transportadora ou documento vinculado — nada a enviar no webhook.", pedidoId);
            return;
        }

        var transportadora = await uow.Transportadoras.GetByIdAsync(transportadoraId, ct);
        if (transportadora is null || !transportadora.WebhookAtivo || string.IsNullOrWhiteSpace(transportadora.WebhookUrl))
            return;

        var documento = await uow.Documentos.GetByIdAsync(documentoId, ct);
        if (documento is null) return;

        var arquivos = await uow.Arquivos.GetByDocumentoAsync(documentoId, ct);
        var xmlArquivo = arquivos.FirstOrDefault(a =>
            a.MimeType == "application/xml" && !a.NomeOriginal.Contains("cancelamento", StringComparison.OrdinalIgnoreCase));
        if (xmlArquivo is null)
        {
            logger.LogWarning("Documento {DocumentoId} (pedido {PedidoId}) autorizado mas sem XML salvo — webhook da transportadora {TransportadoraId} não enviado.", documentoId, pedidoId, transportadoraId);
            return;
        }

        byte[] xmlBytes;
        await using (var stream = await storage.DownloadAsync(xmlArquivo.ObjectKey, xmlArquivo.Bucket, ct))
        {
            using var ms = new MemoryStream();
            await stream.CopyToAsync(ms, ct);
            xmlBytes = ms.ToArray();
        }

        var payload = new
        {
            pedidoNumero = pedido.Numero,
            documento.ChaveAcesso,
            documento.Numero,
            documento.DataEmissao,
            xmlNomeArquivo = xmlArquivo.NomeOriginal,
            xmlBase64 = Convert.ToBase64String(xmlBytes),
        };

        try
        {
            var http = httpFactory.CreateClient("webhook");
            var resp = await http.PostAsJsonAsync(transportadora.WebhookUrl, payload, ct);
            var corpoResposta = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
                throw new InvalidOperationException(
                    $"{(int)resp.StatusCode} {resp.ReasonPhrase} — {Truncar(corpoResposta, 700)}");

            await RegistrarHistoricoAsync(pedido, TipoSucesso,
                $"XML da NF-e enviado pro webhook da transportadora \"{transportadora.RazaoSocial}\".", ct);

            logger.LogInformation("Webhook da transportadora {TransportadoraId} disparado com sucesso pro documento {DocumentoId}.", transportadoraId, documentoId);
        }
        catch (Exception ex)
        {
            await RegistrarHistoricoAsync(pedido, TipoFalha,
                $"Falha ao enviar o XML pro webhook da transportadora \"{transportadora.RazaoSocial}\" ({transportadora.WebhookUrl}): {Truncar(ex.Message, 800)}", ct);

            logger.LogError(ex, "Falha ao disparar webhook da transportadora {TransportadoraId} pro documento {DocumentoId}.", transportadoraId, documentoId);

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
