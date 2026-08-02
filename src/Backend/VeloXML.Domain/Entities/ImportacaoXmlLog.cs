using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class ImportacaoXmlLog : BaseEntity
{
    public Guid? ContadorId { get; set; }
    public OrigemImportacaoEnum Origem { get; set; } = OrigemImportacaoEnum.ImportacaoEmail;
    public DateTime ExecutadoEm { get; set; }
    public Guid ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public int EmailsEncontrados { get; set; }
    public int XmlsProcessados { get; set; }
    public int XmlsImportados { get; set; }
    public int Erros { get; set; }
    public string? MensagemErro { get; set; }

    // Documentos criados nesse log — permite linkar direto pro documento importado.
    // Um log de ApiIngest sempre tem 0 ou 1; um log de e-mail pode ter vários (um por
    // anexo/XML importado com sucesso na mesma execução).
    public List<Guid> DocumentoIds { get; set; } = [];
}
