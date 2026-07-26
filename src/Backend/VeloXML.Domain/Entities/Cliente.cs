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

    // Configuração Fiscal (NF-e)
    public string? RegimeTributario { get; set; }       // SimpesNacional, LucroPresumido, LucroReal, Mei
    public string? InscricaoEstadual { get; set; }
    public string? InscricaoMunicipal { get; set; }
    public string? CnaePrincipal { get; set; }
    public string SerieNfe { get; set; } = "1";
    public bool NfeHabilitado { get; set; }

    // Certificado A1
    public string? CertificadoA1Key { get; set; }      // caminho no MinIO
    public string? CertificadoA1Senha { get; set; }    // senha criptografada
    public DateTime? CertificadoA1Validade { get; set; }

    public Contador? Contador { get; set; }
    public Tenant? Tenant { get; set; }
    public ICollection<Documento> Documentos { get; set; } = [];
    public ICollection<Configuracao> Configuracoes { get; set; } = [];
    public ICollection<Produto> Produtos { get; set; } = [];
    public ICollection<Destinatario> Destinatarios { get; set; } = [];
    public ICollection<Pedido> Pedidos { get; set; } = [];
}
