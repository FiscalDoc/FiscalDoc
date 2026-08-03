using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Pedidos.Common;

internal static class PedidoEmissaoHelper
{
    // Vincular uma NF-e real (importada manualmente ou emitida via Focus NFe) é, na prática,
    // a emissão do pedido — só promove de Rascunho, nunca reabre um pedido cancelado.
    public static void VincularDocumentoAutorizado(Pedido pedido, Documento documento)
    {
        pedido.DocumentoId = documento.Id;
        if (pedido.Status == "Rascunho")
            pedido.Status = "Emitido";
    }
}
