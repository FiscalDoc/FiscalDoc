using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Produto : BaseEntity, IAuditableEntity
{
    public Guid ClienteId { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? Ncm { get; set; }
    public string Unidade { get; set; } = "UN";
    public decimal PrecoUnitario { get; set; }
    public string? Cfop { get; set; }
    public decimal AliquotaIcms { get; set; }
    public decimal AliquotaPis { get; set; }
    public decimal AliquotaCofins { get; set; }

    // CST/CSOSN do ICMS (código de 2-3 dígitos — qual tabela usar depende do regime tributário
    // da empresa: CSOSN pra Simples Nacional, CST pra Lucro Presumido/Real) e CST de
    // PIS/COFINS (2 dígitos) — obrigatórios pra emitir NF-e, antes vinham fixos no código
    // (102/07/07) sem refletir o produto real.
    public string? CstIcms { get; set; }
    public string? CstPis { get; set; }
    public string? CstCofins { get; set; }

    // Origem da mercadoria (tabela oficial SEFAZ, 0-8 — nacional/importada/conteúdo de
    // importação) — vai no campo icms_origem da Focus NFe, separado do CST/CSOSN.
    public int IcmsOrigem { get; set; } = 0;

    // IBS/CBS (reforma tributária, LC 214/2025) — obrigatório na NF-e a partir de 03/08/2026
    // pra empresas do regime Normal (Simples Nacional/MEI só a partir de 04/2027). CST (3
    // dígitos) e cClassTrib (6 dígitos, classificação da operação numa tabela nacional) variam
    // por produto; as alíquotas do período de teste (2026) são fixas por lei, não configuráveis
    // aqui — ver FocusNfePayloadBuilder.
    public string? IbsCbsCst { get; set; }
    public string? IbsCbsClassificacaoTributaria { get; set; }

    // Custo e margem — não entra na NF-e, é só pra saber quanto sobra por venda. Preço de venda
    // já existe (PrecoUnitario); PercentualImposto é uma taxa efetiva simples pra estimativa de
    // margem, separada dos CSTs/alíquotas fiscais (que são pra classificação/conformidade, não
    // pra esse cálculo gerencial).
    public decimal ValorCusto { get; set; } = 0;
    public decimal PercentualImposto { get; set; } = 0;

    public bool Ativo { get; set; } = true;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Cliente? Cliente { get; set; }
}
