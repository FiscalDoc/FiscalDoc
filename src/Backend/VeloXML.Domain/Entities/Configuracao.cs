using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Configuracao : BaseEntity
{
    public Guid? ClienteId { get; set; }
    public string Chave { get; set; } = string.Empty;
    public string Valor { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Global { get; set; }

    public Cliente? Cliente { get; set; }
    public Tenant? Tenant { get; set; }
}
