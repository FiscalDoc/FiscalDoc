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
}
