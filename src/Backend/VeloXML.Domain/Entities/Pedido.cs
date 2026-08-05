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

    // Dados necessários para gerar a NF-e a partir deste pedido.
    public string NaturezaOperacao { get; set; } = "Venda de mercadoria";
    // "Normal" | "Complementar" | "Ajuste" | "Devolucao" — a Focus NFe chama isso de
    // finalidade_emissao (1/2/3/4); cada pedido pode ter uma finalidade diferente, por isso
    // fica aqui e não na configuração fiscal do Cliente.
    public string FinalidadeEmissao { get; set; } = "Normal";
    // "SemFrete" | "EmitenteContaFrete" | "DestinatarioContaFrete" | "Terceiros" — a Focus NFe
    // chama isso de modalidade_frete (9/0/1/2) e é campo obrigatório na emissão real (mesmo a
    // doc pública listando como opcional). "SemFrete" cobre a maioria dos casos de quem não é
    // transportadora.
    public string ModalidadeFrete { get; set; } = "SemFrete";
    public DateTime? DataSaida { get; set; }
    public string? FormaPagamento { get; set; }              // "AVista" | "APrazo"
    public string? MeioPagamento { get; set; }                // "Dinheiro" | "Cartao" | "Pix" | "Boleto" | "Outros"
    public string? InformacoesComplementares { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Vínculo com a NF-e real, emitida num emissor externo e importada de volta como
    // Documento (via e-mail/API/upload) — cobre o caso de uso enquanto este app ainda não
    // emite nota fiscal internamente.
    public Guid? DocumentoId { get; set; }

    public Cliente? Cliente { get; set; }
    public Destinatario? Destinatario { get; set; }
    public Documento? Documento { get; set; }
    public ICollection<PedidoItem> Itens { get; set; } = [];
}
