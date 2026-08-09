using VeloXML.Application.Common;
using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Pedidos.Common;

// Fonte ÚNICA de "qual CST/alíquota vale pra esse item" e "essa operação tem DIFAL" — usada
// tanto pelo FocusNfePayloadBuilder (o que é REALMENTE enviado pra Focus na hora de emitir)
// quanto pelo ImpostosPreviewCalculator (a prévia mostrada na tela antes de emitir). Existir
// só aqui, uma vez, é o que garante que a prévia nunca vai mostrar um número que a emissão de
// verdade depois contraria — mudou uma regra de resolução de imposto, muda só aqui.
internal static class PedidoFiscalResolver
{
    public record ItemFiscal(
        string? Ncm, string? Cfop,
        string? CstIcms, string? CstPis, string? CstCofins, string? CstIpi,
        int IcmsOrigem, decimal AliquotaIcms, decimal AliquotaPis, decimal AliquotaCofins, decimal AliquotaIpi,
        string? IbsCbsCst, string? IbsCbsClassificacaoTributaria
    );

    // Prioriza o cadastro ATUAL do Produto sobre a "foto" gravada no item quando ele foi
    // adicionado ao pedido — completar o cadastro fiscal do produto DEPOIS de já estar num
    // pedido rascunho precisa refletir aqui, tanto na prévia quanto na emissão real.
    public static ItemFiscal Resolver(PedidoItem item) => new(
        item.Produto?.Ncm ?? item.Ncm,
        item.Produto?.Cfop ?? item.Cfop,
        item.Produto?.CstIcms ?? item.CstIcms,
        item.Produto?.CstPis ?? item.CstPis,
        item.Produto?.CstCofins ?? item.CstCofins,
        item.Produto?.CstIpi ?? item.CstIpi,
        item.Produto?.IcmsOrigem ?? item.IcmsOrigem,
        item.Produto?.AliquotaIcms ?? item.AliquotaIcms,
        item.Produto?.AliquotaPis ?? item.AliquotaPis,
        item.Produto?.AliquotaCofins ?? item.AliquotaCofins,
        item.Produto?.AliquotaIpi ?? item.AliquotaIpi,
        item.Produto?.IbsCbsCst ?? item.IbsCbsCst,
        item.Produto?.IbsCbsClassificacaoTributaria ?? item.IbsCbsClassificacaoTributaria
    );

    public record DifalContexto(bool Aplica, string? UfEmitente, string? UfDestinatario, decimal? AliquotaInternaDestino, decimal PercentualFcpDestino);

    // DIFAL (EC 87/2015): operação interestadual destinada a consumidor final — desde 2019
    // (EC 87/2015 + Convênio ICMS 236/21) a partilha é 100% pro estado de destino. Não depende
    // de o destinatário ser contribuinte ou não (a partilha vale pros dois casos desde a EC).
    public static DifalContexto ResolverDifal(Cliente cliente, Destinatario destinatario, Pedido pedido)
    {
        var ufEmitente = cliente.Estado;
        var ufDestinatario = destinatario.Estado;
        var aplica = pedido.ConsumidorFinal
            && !string.IsNullOrWhiteSpace(ufEmitente) && !string.IsNullOrWhiteSpace(ufDestinatario)
            && !string.Equals(ufEmitente, ufDestinatario, StringComparison.OrdinalIgnoreCase);

        var aliquotaInterna = aplica && AliquotasEstaduaisIcms.AliquotaInterna.TryGetValue(ufDestinatario!, out var aliq) ? aliq : (decimal?)null;
        var percentualFcp = aplica && AliquotasEstaduaisIcms.PercentualFcp.TryGetValue(ufDestinatario!, out var fcp) ? fcp : 0m;

        return new DifalContexto(aplica, ufEmitente, ufDestinatario, aliquotaInterna, percentualFcp);
    }

    // Distribui "total" proporcionalmente ao peso (valor bruto) de cada item, sempre batendo
    // EXATO com o total (o resto do arredondamento de centavos vai pro último item que tem
    // peso, senão a soma fica alguns centavos abaixo do total e a SEFAZ rejeita do mesmo jeito).
    // Sem peso em nenhum item (ex.: todos a R$ 0), divide igualmente entre todos.
    public static List<decimal> DistribuirProporcional(decimal total, List<decimal> pesos)
    {
        var resultado = new List<decimal>(new decimal[pesos.Count]);
        if (total <= 0 || pesos.Count == 0) return resultado;

        var somaPesos = pesos.Sum();
        var baseIgualitaria = somaPesos <= 0;
        var acumulado = 0m;
        var ultimoIndiceValido = baseIgualitaria ? pesos.Count - 1 : pesos.FindLastIndex(p => p > 0);

        for (var i = 0; i < pesos.Count; i++)
        {
            if (i == ultimoIndiceValido)
            {
                resultado[i] = Math.Round(total - acumulado, 2);
                break;
            }

            if (!baseIgualitaria && pesos[i] <= 0) continue;

            var parcela = baseIgualitaria
                ? Math.Round(total / pesos.Count, 2)
                : Math.Round(total * pesos[i] / somaPesos, 2);
            resultado[i] = parcela;
            acumulado += parcela;
        }

        return resultado;
    }
}
