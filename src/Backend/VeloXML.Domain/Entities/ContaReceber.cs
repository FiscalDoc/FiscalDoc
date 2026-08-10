using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

// Contas a receber do CLIENTE (a empresa que usa o VeloXML) junto aos próprios clientes finais
// (Destinatario) — diferente de Cobranca, que é a mensalidade que O PRÓPRIO VeloXML cobra do
// Contador/Cliente. Só controle manual por enquanto: sem boleto/PIX de verdade, baixa é o
// usuário marcando como pago na tela.
public class ContaReceber : BaseEntity, IAuditableEntity
{
    public Guid ClienteId { get; set; }
    public Guid DestinatarioId { get; set; }
    // Opcional — nem toda conta a receber precisa ter vindo de um Pedido emitido (pode ser um
    // acordo à parte), mas quando vem, ajuda a rastrear a origem.
    public Guid? PedidoId { get; set; }

    public string Descricao { get; set; } = string.Empty;
    public decimal ValorTotal { get; set; }
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    public StatusContaReceberEnum Status { get; set; } = StatusContaReceberEnum.Pendente;
    public string? FormaPagamento { get; set; }
    public string? Observacao { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Cliente? Cliente { get; set; }
    public Destinatario? Destinatario { get; set; }
    public Pedido? Pedido { get; set; }
}
