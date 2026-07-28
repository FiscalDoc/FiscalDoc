using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Pedido : BaseEntity, IAuditableEntity
{
    public Guid ClienteId { get; set; }
    public Guid DestinatarioId { get; set; }
    public int Numero { get; set; }
    public string Status { get; set; } = "Rascunho"; // Rascunho, Emitido, Cancelado
    public string? Observacoes { get; set; }
    public decimal ValorTotal { get; set; }

    // Dados necessários para, futuramente, gerar a NF-e a partir deste pedido.
    public string NaturezaOperacao { get; set; } = "Venda de mercadoria";
    public DateTime? DataSaida { get; set; }
    public string? FormaPagamento { get; set; }              // "AVista" | "APrazo"
    public string? MeioPagamento { get; set; }                // "Dinheiro" | "Cartao" | "Pix" | "Boleto" | "Outros"
    public string? InformacoesComplementares { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Cliente? Cliente { get; set; }
    public Destinatario? Destinatario { get; set; }
    public ICollection<PedidoItem> Itens { get; set; } = [];
}
