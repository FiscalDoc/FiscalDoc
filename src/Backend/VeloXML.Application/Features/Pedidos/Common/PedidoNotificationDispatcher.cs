using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Pedidos.Common;

// Ponto único de decisão sobre os dois gatilhos automáticos de um Pedido virar "Emitido":
// webhook de XML pra Transportadora e e-mail de NF-e pro Destinatário. Chamado depois que o
// Pedido (e, se houver, o Documento) já foram commitados — só enfileira (fire-and-forget via
// Hangfire), nunca bloqueia quem chamou nem falha a emissão por causa de um desses gatilhos.
public sealed class PedidoNotificationDispatcher(IBackgroundJobDispatcher jobs)
{
    // temDocumentoComXml: true quando esta emissão já tem um Documento com XML de verdade
    // vinculado (Focus NFe autorizada ou XML importado/vinculado manualmente) — false no
    // fluxo antigo de "Emitir Pedido" sem nenhuma NF-e real.
    public void AoEmitir(Pedido pedido, Cliente cliente, bool temDocumentoComXml)
    {
        if (pedido.TransportadoraId.HasValue && temDocumentoComXml)
            jobs.EnqueueTransportadoraWebhook(pedido.Id);

        if (!cliente.EmailNfeDestinatarioHabilitado)
            return;

        var gatilhoAtendido = cliente.EmailNfeDestinatarioGatilho == "Pedido" || temDocumentoComXml;
        if (gatilhoAtendido)
            jobs.EnqueueEmailNfeDestinatario(pedido.Id);
    }
}
