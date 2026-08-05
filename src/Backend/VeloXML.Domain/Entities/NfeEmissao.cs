using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

// Sem navegação/FK pra Tenant de propósito (mesmo padrão do ImportacaoXmlLog/Configuracao) —
// pode ser finalizada tanto pelo comando autenticado quanto pelo webhook público da Focus
// (sem ICurrentUser/HttpContext), então TenantId é sempre gravado explicitamente a partir do
// Pedido/Cliente já carregado, nunca deve travar em constraint de referência.
public class NfeEmissao : BaseEntity
{
    public Guid PedidoId { get; set; }
    public Guid ClienteId { get; set; }
    public string Ref { get; set; } = string.Empty;
    public string Ambiente { get; set; } = "homologacao";
    public NfeEmissaoStatusEnum Status { get; set; } = NfeEmissaoStatusEnum.Enviada;
    public string? MensagemErro { get; set; }
    public string? ChaveAcesso { get; set; }
    public string? Numero { get; set; }
    public string? Serie { get; set; }
    public Guid? DocumentoId { get; set; }
    public string? UltimoPayloadRespostaJson { get; set; }
    // Quem clicou em "Emitir NF-e" — gravado na criação e reaproveitado pelo NfeEmissaoFinalizer
    // pra atribuir corretamente as entradas de histórico geradas depois, mesmo quando quem
    // fecha o ciclo é o webhook/job de polling (sem ICurrentUser).
    public string? SolicitadoPorNome { get; set; }
    // JSON de List<FocusNfeCampoErro> (campo/mensagem) — persistido pra sobreviver a um reload
    // da tela, já que MensagemErro é só o texto plano. Usado pelo frontend pra montar o modal
    // de erro por campo (com explicação e link de correção).
    public string? ErrosDetalhadosJson { get; set; }
}
