using VeloXML.Domain.Enums;

namespace VeloXML.Application.Common;

internal static class DocumentoFaturamentoHelper
{
    // Um Documento marcado Duplicado é a mesma NF-e que já existe em outro Documento (mesma
    // chave de acesso, gerado quando a Focus reenvia webhook/polling pra uma emissão que já
    // tinha sido finalizada, ou quando o mesmo XML é importado de novo) — contar o valor dos
    // dois dobraria o faturamento real. Cancelado também não vale mais nada. Nenhum dos dois
    // deve entrar em soma de faturamento.
    public static bool ContaComoFaturamento(StatusDocumentoEnum status) =>
        status != StatusDocumentoEnum.Cancelado && status != StatusDocumentoEnum.Duplicado;
}
