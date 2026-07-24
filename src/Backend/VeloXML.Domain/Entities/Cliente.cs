using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class Cliente : BaseEntity, IAuditableEntity
{
    public string RazaoSocial { get; set; } = string.Empty;
    public string? NomeFantasia { get; set; }
    public string Cnpj { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Telefone { get; set; }
    public string? Endereco { get; set; }
    public string? Cidade { get; set; }
    public string? Estado { get; set; }
    public bool Ativo { get; set; } = true;
    public Guid ContadorId { get; set; }
    public string AppKey { get; set; } = Guid.NewGuid().ToString("N");
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }

    // Webhook
    public bool WebhookHabilitado { get; set; }
    public string? WebhookUrl { get; set; }

    // Importação de XML via e-mail (IMAP)
    public bool ImapHabilitado { get; set; }
    public string? ImapHost { get; set; }
    public int ImapPort { get; set; } = 993;
    public string? ImapEmail { get; set; }
    public string? ImapSenha { get; set; }

    public Contador? Contador { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<Documento> Documentos { get; set; } = [];
    public ICollection<Configuracao> Configuracoes { get; set; } = [];
}
