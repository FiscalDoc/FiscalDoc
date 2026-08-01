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

    public Cliente? Cliente { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<Arquivo> Arquivos { get; set; } = [];
    public ICollection<Alerta> Alertas { get; set; } = [];
}
