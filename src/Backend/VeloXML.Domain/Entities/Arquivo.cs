using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Arquivo : BaseEntity
{
    public Guid DocumentoId { get; set; }
    public string NomeArquivo { get; set; } = string.Empty;
    public string NomeOriginal { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;
    public string ObjectKey { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string? Hash { get; set; }
    public string? Url { get; set; }
    public long Tamanho { get; set; }

    public Documento? Documento { get; set; }
    public Tenant? Tenant { get; set; }
}
