using VeloXML.Application.Common;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Pedidos.Common;

// Calcula uma prévia REAL dos impostos do pedido antes de emitir. "Real" no sentido de que usa
// a MESMA resolução de CST/alíquota e a MESMA detecção de DIFAL que o FocusNfePayloadBuilder
// usa pra montar o payload de emissão de verdade — ambos chamam PedidoFiscalResolver, não tem
// regra duplicada entre os dois. A única coisa que existe SÓ aqui é a multiplicação
// base×alíquota em si: na emissão real, quem faz essa conta é a própria Focus (a gente manda
// base+alíquota, não o valor final) — não tem como "reaproveitar" esse cálculo porque ele roda
// do lado de fora, no servidor deles. Essa prévia faz a mesma conta localmente só pra mostrar
// o resultado em dinheiro antes de gastar uma tentativa de emissão de verdade.
internal static class ImpostosPreviewCalculator
{
    public static DocumentoImpostosDto Calcular(Cliente cliente, Pedido pedido)
    {
        var destinatario = pedido.Destinatario!;
        var difal = PedidoFiscalResolver.ResolverDifal(cliente, destinatario, pedido);

        decimal valorProdutos = 0, valorBaseIcms = 0, valorIcms = 0, valorPis = 0, valorCofins = 0, valorIpi = 0;
        decimal valorDifal = 0, valorFcp = 0;

        var itens = pedido.Itens.ToList();
        foreach (var item in itens)
        {
            var f = PedidoFiscalResolver.Resolver(item);

            // Mesma base "valor da operação" (modalidade 3) usada no FocusNfePayloadBuilder —
            // valor cheio do item, sem desconto (o desconto não reduz base de ICMS/PIS/COFINS
            // por padrão, só o valor final do pedido).
            var baseItem = item.Quantidade * item.PrecoUnitario;
            valorProdutos += baseItem;

            if (f.AliquotaIcms > 0)
            {
                valorBaseIcms += baseItem;
                valorIcms += Math.Round(baseItem * f.AliquotaIcms / 100, 2);
            }
            if (f.AliquotaPis > 0) valorPis += Math.Round(baseItem * f.AliquotaPis / 100, 2);
            if (f.AliquotaCofins > 0) valorCofins += Math.Round(baseItem * f.AliquotaCofins / 100, 2);
            if (!string.IsNullOrWhiteSpace(f.CstIpi) && f.AliquotaIpi > 0) valorIpi += Math.Round(baseItem * f.AliquotaIpi / 100, 2);

            if (difal.Aplica && difal.AliquotaInternaDestino.HasValue)
            {
                var aliquotaInterestadual = AliquotasEstaduaisIcms.AliquotaInterestadual(f.IcmsOrigem, difal.UfEmitente!, difal.UfDestinatario!);
                var diferencial = difal.AliquotaInternaDestino.Value - aliquotaInterestadual;
                if (diferencial > 0) valorDifal += Math.Round(baseItem * diferencial / 100, 2);
                if (difal.PercentualFcpDestino > 0) valorFcp += Math.Round(baseItem * difal.PercentualFcpDestino / 100, 2);
            }
        }

        return new DocumentoImpostosDto(
            ValorBaseCalculoIcms: valorBaseIcms,
            ValorProdutos: valorProdutos,
            ValorFrete: pedido.ValorFrete,
            ValorSeguro: pedido.ValorSeguro,
            ValorDesconto: itens.Sum(i => i.Desconto),
            ValorIcms: valorIcms,
            ValorIpi: valorIpi,
            ValorPis: valorPis,
            ValorCofins: valorCofins,
            ValorOutrasDespesas: pedido.ValorOutrasDespesas,
            ValorAproxTributos: valorIcms + valorPis + valorCofins,
            ValorIbs: null,
            ValorCbs: null,
            ValorDifal: difal.Aplica ? valorDifal : null,
            ValorFcp: difal.Aplica ? valorFcp : null
        );
    }
}
