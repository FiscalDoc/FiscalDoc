using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class CobrancaContador : BaseEntity
{
    public Guid ContadorId { get; set; }
    public int Mes { get; set; }
    public int Ano { get; set; }

    // Snapshot do plano no momento da geração
    public int TotalClientes { get; set; }
    public decimal ValorPorCliente { get; set; }
    public decimal ValorBase { get; set; }          // TotalClientes × ValorPorCliente

    public int LimiteXmlTotal { get; set; }         // TotalClientes × LimiteXmlPorCliente
    public int XmlsProcessados { get; set; }
    public int XmlsExcedentes { get; set; }
    public decimal ValorExcedente { get; set; }
    public decimal ValorTotal { get; set; }         // ValorBase + ValorExcedente

    public StatusCobrancaEnum Status { get; set; } = StatusCobrancaEnum.Pendente;
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    public string? Observacao { get; set; }

    public Contador? Contador { get; set; }
}
