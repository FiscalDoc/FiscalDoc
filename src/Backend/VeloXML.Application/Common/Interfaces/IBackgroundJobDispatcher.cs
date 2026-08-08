namespace VeloXML.Application.Common.Interfaces;

// Abstrai o agendamento fire-and-forget de jobs em background (Hangfire, na Infrastructure) —
// a Application não referencia o pacote Hangfire diretamente, só sabe que "algo" vai executar
// esses jobs de forma assíncrona e com retry automático em caso de falha.
public interface IBackgroundJobDispatcher
{
    void EnqueueTransportadoraWebhook(Guid pedidoId);
    void EnqueueEmailNfeDestinatario(Guid pedidoId);
}
