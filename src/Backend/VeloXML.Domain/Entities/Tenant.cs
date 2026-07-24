using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Nome { get; set; } = string.Empty;
    public string? Cnpj { get; set; }
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime? PlanoExpiracao { get; set; }
    public string Plano { get; set; } = "Starter";

    public ICollection<User> Users { get; set; } = [];
    public ICollection<Contador> Contadores { get; set; } = [];
    public ICollection<Cliente> Clientes { get; set; } = [];
}
