namespace VeloXML.Application.Common.Interfaces;

public interface IWebhookService
{
    Task NotifyDocumentoAsync(Guid clienteId, object payload, CancellationToken ct = default);
}
