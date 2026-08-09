namespace VeloXML.Application.Common;

// Tabelas oficiais da SEFAZ usadas tanto na pré-validação antes de emitir (EmitirNfeFocusCommandHandler)
// quanto na montagem do payload (FocusNfePayloadBuilder) — centralizado aqui pra não duplicar
// as listas de código em dois lugares e ficar fácil de revisar/estender.
internal static class CodigosFiscais
{
    // CST do ICMS — regime Normal (Lucro Presumido/Real). Tabela B do Anexo do Convênio s/n 70/97.
    public static readonly HashSet<string> CstIcmsValidos = new(StringComparer.Ordinal)
    {
        "00", "10", "20", "30", "40", "41", "50", "51", "60", "70", "90",
    };

    // CSOSN — Simples Nacional/MEI. Tabela do Anexo do Convênio ICMS 92/15.
    public static readonly HashSet<string> CsosnValidos = new(StringComparer.Ordinal)
    {
        "101", "102", "103", "201", "202", "203", "300", "400", "500", "900",
    };

    // CST de PIS/COFINS — mesma tabela pros dois tributos (Instrução Normativa SRF 594/2005).
    public static readonly HashSet<string> CstPisCofinsValidos = new(StringComparer.Ordinal)
    {
        "01", "02", "03", "04", "05", "06", "07", "08", "09",
        "49", "50", "51", "52", "53", "54", "55", "56",
        "60", "61", "62", "63", "64", "65", "66", "67",
        "70", "71", "72", "73", "74", "75", "98", "99",
    };

    // CST de IPI — só os de SAÍDA importam aqui, esse sistema nunca emite NF-e de entrada
    // (tipo_documento sempre 1 em FocusNfePayloadBuilder).
    public static readonly HashSet<string> CstIpiSaidaValidos = new(StringComparer.Ordinal)
    {
        "50", "51", "52", "53", "54", "55", "99",
    };

    // CFOPs de exportação (grupo 7.xxx) implicam imunidade constitucional de ICMS (CF art. 155
    // §2º X, "a") — usar um CST/CSOSN que cobra ICMS junto com um CFOP de exportação é
    // incompatibilidade certa, essa é a única combinação CST×CFOP suficientemente inequívoca
    // pra validar sem uma tabela completa de compatibilidade (que seria enorme e específica
    // demais por segmento).
    public static readonly HashSet<string> CstIcmsIsentosOuNaoTributados = new(StringComparer.Ordinal)
    {
        "40", "41", "50",
    };
    public static readonly HashSet<string> CsosnIsentosOuNaoTributados = new(StringComparer.Ordinal)
    {
        "300", "400", "500",
    };

    public static bool EhCstIcmsOuCsosnValido(string? codigo, bool regimeNormal) =>
        !string.IsNullOrWhiteSpace(codigo) && (regimeNormal ? CstIcmsValidos : CsosnValidos).Contains(codigo);

    public static bool EhCfopDeExportacao(string? cfop) =>
        !string.IsNullOrWhiteSpace(cfop) && cfop.Length == 4 && cfop[0] == '7';

    // CFOP de saída (grupo 5/6/7) precisa ser coerente com a UF do emitente x destinatário:
    // 5xxx = dentro do mesmo estado, 6xxx = para outro estado, 7xxx = exterior. Só valida saída
    // porque esse sistema nunca emite entrada (tipo_documento fixo em 1).
    public static string? ValidarCfopUf(string? cfop, string? ufEmitente, string? ufDestinatario)
    {
        if (string.IsNullOrWhiteSpace(cfop) || cfop.Length != 4 || !cfop.All(char.IsDigit))
            return null; // formato inválido é pego em outro lugar, não aqui

        var prefixo = cfop[0];
        if (prefixo is not ('5' or '6' or '7'))
            return $"CFOP \"{cfop}\" não é um CFOP de saída válido (deveria começar com 5, 6 ou 7).";

        if (string.IsNullOrWhiteSpace(ufDestinatario)) return null; // sem UF do destinatário, não dá pra cruzar

        var mesmoEstado = string.Equals(ufEmitente, ufDestinatario, StringComparison.OrdinalIgnoreCase);
        if (prefixo == '5' && !mesmoEstado)
            return $"CFOP \"{cfop}\" é de operação dentro do estado (prefixo 5), mas o destinatário é de {ufDestinatario} e o emitente de {ufEmitente} — operação interestadual precisa de CFOP 6xxx.";
        if (prefixo == '6' && mesmoEstado)
            return $"CFOP \"{cfop}\" é de operação interestadual (prefixo 6), mas emitente e destinatário são do mesmo estado ({ufEmitente}) — operação interna precisa de CFOP 5xxx.";

        return null;
    }

    // Só a checagem inequívoca descrita acima (exportação x CST que cobra ICMS) — não é uma
    // tabela completa de compatibilidade CST×CFOP (que também dependeria de CFOPs de
    // substituição tributária, consignação etc., específicos demais pra validar aqui sem
    // arriscar bloquear emissões legítimas por uma regra incompleta).
    public static string? ValidarCstCfop(string? cfop, string? cstIcms, bool regimeNormal)
    {
        if (!EhCfopDeExportacao(cfop) || string.IsNullOrWhiteSpace(cstIcms)) return null;

        var isento = regimeNormal ? CstIcmsIsentosOuNaoTributados.Contains(cstIcms) : CsosnIsentosOuNaoTributados.Contains(cstIcms);
        if (!isento)
            return $"CFOP \"{cfop}\" é de exportação (imune de ICMS por definição constitucional), mas o {(regimeNormal ? "CST" : "CSOSN")} \"{cstIcms}\" cobra ICMS — use um código de isenção/não incidência.";

        return null;
    }

    // Sugestão de CFOP por natureza da operação — só as operações comuns em que o CFOP é
    // inequívoco o bastante pra sugerir com segurança (ex.: "Prestação de serviço" não usa CFOP
    // de mercadoria, fica de fora de propósito). É só um PONTO DE PARTIDA pro campo do item —
    // o usuário sempre pode trocar; nunca preenche por cima de um CFOP que já foi digitado.
    private static readonly Dictionary<string, string> SufixoCfopPorNatureza = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Venda de mercadoria"] = "102",
        ["Venda de mercadoria adquirida ou recebida de terceiros"] = "102",
        ["Devolução de compra"] = "202",
        ["Transferência de mercadoria"] = "152",
        ["Remessa para conserto"] = "915",
        ["Retorno de mercadoria remetida para conserto"] = "916",
        ["Remessa em bonificação, doação ou brinde"] = "910",
        ["Remessa para demonstração"] = "912",
        ["Remessa para industrialização"] = "901",
    };

    public static string? SugerirCfop(string? naturezaOperacao, string? ufEmitente, string? ufDestinatario)
    {
        if (string.IsNullOrWhiteSpace(naturezaOperacao)) return null;
        if (!SufixoCfopPorNatureza.TryGetValue(naturezaOperacao.Trim(), out var sufixo)) return null;

        var mesmoEstado = string.IsNullOrWhiteSpace(ufDestinatario) || string.Equals(ufEmitente, ufDestinatario, StringComparison.OrdinalIgnoreCase);
        var prefixo = mesmoEstado ? '5' : '6';
        return $"{prefixo}{sufixo}";
    }
}
