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
    public bool Ativo { get; set; } = true;
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    public Cliente? Cliente { get; set; }
}
