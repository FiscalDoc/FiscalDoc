using System.Net.Http.Json;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Webhooks;

public sealed class WebhookService(
    IUnitOfWork uow,
    IHttpClientFactory httpFactory,
    ILogger<WebhookService> logger) : IWebhookService
{
    public async Task NotifyDocumentoAsync(Guid clienteId, object payload, CancellationToken ct = default)
    {
        var cliente = await uow.Clientes.GetByIdAsync(clienteId, ct);
        if (cliente is null || !cliente.WebhookHabilitado || string.IsNullOrEmpty(cliente.WebhookUrl))
            return;

        try
        {
            var http = httpFactory.CreateClient("webhook");
            var resp = await http.PostAsJsonAsync(cliente.WebhookUrl, payload, ct);
            if (!resp.IsSuccessStatusCode)
                logger.LogWarning("Webhook {Url} respondeu {Status}", cliente.WebhookUrl, (int)resp.StatusCode);
            else
                logger.LogInformation("Webhook disparado para cliente {ClienteId}", clienteId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao disparar webhook para cliente {ClienteId}", clienteId);
        }
    }
}
