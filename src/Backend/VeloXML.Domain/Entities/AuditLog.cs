using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class AuditLog : BaseEntity
{
    public string Tabela { get; set; } = string.Empty;
    public string Operacao { get; set; } = string.Empty;
    public string? RegistroId { get; set; }
    public string? ValoresAntigos { get; set; }
    public string? ValoresNovos { get; set; }
    public string? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
}
