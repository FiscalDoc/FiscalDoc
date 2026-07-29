using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Cobranca : BaseEntity
{
    // Exatamente um dos dois deve estar preenchido — o tipo de contrato do cobrado.
    public Guid? ContadorId { get; set; }
    public Guid? ClienteId { get; set; }

    public int Mes { get; set; }
    public int Ano { get; set; }

    // Snapshot do plano no momento da geração (preenchido automaticamente só para Contador;
    // cobranças manuais de Cliente direto usam apenas ValorTotal).
    public int TotalClientes { get; set; }
    public decimal ValorPorCliente { get; set; }
    public decimal ValorBase { get; set; }

    public int LimiteXmlTotal { get; set; }
    public int XmlsProcessados { get; set; }
    public int XmlsExcedentes { get; set; }
    public decimal ValorExcedente { get; set; }
    public decimal ValorTotal { get; set; }

    public StatusCobrancaEnum Status { get; set; } = StatusCobrancaEnum.Pendente;
    public DateTime DataVencimento { get; set; }
    public DateTime? DataPagamento { get; set; }
    public string? Observacao { get; set; }

    public Contador? Contador { get; set; }
    public Cliente? Cliente { get; set; }
}
