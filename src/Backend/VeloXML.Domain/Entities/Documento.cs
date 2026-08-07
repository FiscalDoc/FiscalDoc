using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Documento : BaseEntity, IAuditableEntity
{
    public Guid ClienteId { get; set; }
    public TipoDocumentoEnum Tipo { get; set; }
    public StatusDocumentoEnum Status { get; set; } = StatusDocumentoEnum.Pendente;
    public OrigemImportacaoEnum OrigemImportacao { get; set; } = OrigemImportacaoEnum.Manual;
    public string Numero { get; set; } = string.Empty;
    public string? ChaveAcesso { get; set; }
    public string? CnpjEmitente { get; set; }
    public string? NomeEmitente { get; set; }
    public string? CnpjDestinatario { get; set; }
    public string? NomeDestinatario { get; set; }
    public DateTime DataEmissao { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Observacao { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Preenchidos só quando a NF-e é cancelada de verdade na SEFAZ via Focus (não é o mesmo
    // que "Pedido cancelado" — um Pedido pode ser cancelado sem nunca ter tido NF-e).
    public string? MotivoCancelamento { get; set; }
    public DateTime? DataCancelamento { get; set; }
    // Protocolo do EVENTO de cancelamento na SEFAZ — diferente do protocolo de autorização
    // original (a nota emitida e o cancelamento dela são dois eventos SEFAZ distintos, cada
    // um com seu próprio número de protocolo).
    public string? ProtocoloCancelamento { get; set; }

    // Totais de impostos extraídos de <total><ICMSTot> do XML — só preenchido pra NFe.
    public decimal? ValorBaseCalculoIcms { get; set; }
    public decimal? ValorProdutos { get; set; }
    public decimal? ValorFrete { get; set; }
    public decimal? ValorSeguro { get; set; }
    public decimal? ValorDesconto { get; set; }
    public decimal? ValorIcms { get; set; }
    public decimal? ValorIpi { get; set; }
    public decimal? ValorPis { get; set; }
    public decimal? ValorCofins { get; set; }
    public decimal? ValorOutrasDespesas { get; set; }
    public decimal? ValorAproxTributos { get; set; }
    // IBS/CBS (reforma tributária, NT 2025.002) — extraídos de <total><IBSCBSTot> do XML
    // autorizado, mesmo padrão dos demais totais acima.
    public decimal? ValorIbs { get; set; }
    public decimal? ValorCbs { get; set; }

    // Itens (produtos/serviços) da nota, serializados em JSON — só pra exibição, não
    // normalizado em tabela própria porque nada além do modal de detalhe consulta isso.
    public string? ItensJson { get; set; }

    // Dados complementares só usados pra montar a visualização de DANFE (série, natureza da
    // operação, protocolo de autorização, endereço completo de emitente/destinatário) —
    // agrupados num único JSON em vez de uma coluna por campo.
    public string? DanfeJson { get; set; }

    public Cliente? Cliente { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<Arquivo> Arquivos { get; set; } = [];
    public ICollection<Alerta> Alertas { get; set; } = [];
}
