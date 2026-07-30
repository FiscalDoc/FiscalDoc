using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class ImportacaoXmlLog : BaseEntity
{
    public Guid? ContadorId { get; set; }
    public DateTime ExecutadoEm { get; set; }
    public Guid ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public int EmailsEncontrados { get; set; }
    public int XmlsProcessados { get; set; }
    public int XmlsImportados { get; set; }
    public int Erros { get; set; }
    public string? MensagemErro { get; set; }
}
