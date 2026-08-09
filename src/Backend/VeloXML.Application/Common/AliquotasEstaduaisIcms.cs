namespace VeloXML.Application.Common;

// ⚠️ TABELA SUJEITA A MUDANÇA — cada estado define/reajusta sua própria alíquota interna e o
// FCP por lei estadual, isso muda com alguma frequência (e o FCP em especial costuma variar
// por categoria de produto dentro do mesmo estado, não é um número único). Os valores abaixo
// são as alíquotas "padrão" mais comuns de cada estado — servem de base pro cálculo de DIFAL,
// mas o ideal é um contador revisar periodicamente contra a legislação vigente, principalmente
// se o cliente vende pra vários estados ou produtos com alíquota diferenciada.
internal static class AliquotasEstaduaisIcms
{
    // Alíquota interna "padrão" do ICMS por UF (%) — a maioria dos produtos usa essa alíquota,
    // mas categorias específicas (bebidas, cigarros, combustível, energia, telecom etc.) têm
    // alíquotas próprias mais altas que essa tabela NÃO cobre.
    public static readonly IReadOnlyDictionary<string, decimal> AliquotaInterna = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
    {
        ["AC"] = 19m, ["AL"] = 19m, ["AP"] = 18m, ["AM"] = 20m, ["BA"] = 19m,
        ["CE"] = 20m, ["DF"] = 20m, ["ES"] = 17m, ["GO"] = 19m, ["MA"] = 22m,
        ["MT"] = 17m, ["MS"] = 17m, ["MG"] = 18m, ["PA"] = 19m, ["PB"] = 20m,
        ["PR"] = 19.5m, ["PE"] = 20.5m, ["PI"] = 21m, ["RJ"] = 20m, ["RN"] = 18m,
        ["RS"] = 17m, ["RO"] = 19.5m, ["RR"] = 20m, ["SC"] = 17m, ["SP"] = 18m,
        ["SE"] = 19m, ["TO"] = 20m,
    };

    // FCP (Fundo de Combate à Pobreza) "padrão" — deixado em 0 pra maioria por ser variável
    // demais por categoria de produto pra ter um valor único confiável; só preenchido nos
    // estados/casos mais estáveis. Fica 0 = não calcula FCP nenhum, comportamento seguro por
    // padrão (nunca cobra um FCP errado — na dúvida, o contador configura manualmente depois).
    public static readonly IReadOnlyDictionary<string, decimal> PercentualFcp = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    // Alíquota interestadual (ICMS que já sai destacado na origem, art. 155 §2º VII CF):
    // 4% pra mercadoria importada ou com conteúdo de importação (Resolução do Senado 13/2012),
    // 7% de Sul/Sudeste (exceto ES) pra Norte/Nordeste/Centro-Oeste/ES, 12% nos demais casos.
    // icmsOrigem 1/2/6/7 = importação direta ou sem similar nacional, 3/8 = nacional com
    // conteúdo importado > 40% — todos entram na regra dos 4%. Origem 5 (conteúdo importado
    // <= 40%) fica de fora de propósito, não se enquadra na resolução.
    private static readonly HashSet<string> UfsSulSudesteExcetoEs = new(StringComparer.OrdinalIgnoreCase) { "SP", "RJ", "MG", "PR", "SC", "RS" };

    public static decimal AliquotaInterestadual(int icmsOrigem, string ufEmitente, string ufDestinatario)
    {
        if (icmsOrigem is 1 or 2 or 3 or 6 or 7 or 8) return 4m;
        var origemSulSudeste = UfsSulSudesteExcetoEs.Contains(ufEmitente);
        var destinoNaoSulSudeste = !UfsSulSudesteExcetoEs.Contains(ufDestinatario) || string.Equals(ufDestinatario, "ES", StringComparison.OrdinalIgnoreCase);
        return origemSulSudeste && destinoNaoSulSudeste ? 7m : 12m;
    }
}
