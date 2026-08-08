using Hangfire;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

public sealed class BackgroundJobDispatcher(IBackgroundJobClient client) : IBackgroundJobDispatcher
{
    public void EnqueueTransportadoraWebhook(Guid pedidoId) =>
        client.Enqueue<TransportadoraWebhookJob>(j => j.ExecuteAsync(pedidoId, CancellationToken.None));

    public void EnqueueEmailNfeDestinatario(Guid pedidoId) =>
        client.Enqueue<EnviarEmailNfeDestinatarioJob>(j => j.ExecuteAsync(pedidoId, CancellationToken.None));
}
