using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Contador : BaseEntity, IAuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefone { get; set; }
    public string? Crc { get; set; }
    public string? Empresa { get; set; }
    public bool Ativo { get; set; } = true;
    public bool NotifNovasNotas { get; set; } = true;
    public bool NotifAlertas { get; set; } = true;
    public bool NotifResumoSemanal { get; set; }
    public bool NotifConsolidadoMensal { get; set; }
    public string CanalNotificacao { get; set; } = "ambos";
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Licenciamento
    public StatusLicencaEnum StatusLicenca { get; set; } = StatusLicencaEnum.Ativo;
    public string? MotivoBloqueio { get; set; }
    public DateTime? DataLimiteAcesso { get; set; }

    public string? FotoUrl { get; set; }

    // Plano / cobrança
    public decimal ValorPorCliente { get; set; } = 100m;
    public int LimiteXmlPorCliente { get; set; } = 100;
    public decimal ValorXmlExcedente { get; set; } = 1m;

    public Tenant? Tenant { get; set; }
    public ICollection<Cliente> Clientes { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];
    public ICollection<CobrancaContador> Cobrancas { get; set; } = [];
}
