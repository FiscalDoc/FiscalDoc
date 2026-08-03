using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Alerta : BaseEntity
{
    public Guid? DocumentoId { get; set; }
    public Guid? PedidoId { get; set; }
    public Guid ClienteId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string Tipo { get; set; } = string.Empty;
    public string Severidade { get; set; } = "info";
    public StatusAlertaEnum Status { get; set; } = StatusAlertaEnum.Ativo;
    public DateTime? LidoEm { get; set; }
    public string? LidoPor { get; set; }

    public Documento? Documento { get; set; }
    public Pedido? Pedido { get; set; }
    public Cliente? Cliente { get; set; }
    public Tenant? Tenant { get; set; }
}
