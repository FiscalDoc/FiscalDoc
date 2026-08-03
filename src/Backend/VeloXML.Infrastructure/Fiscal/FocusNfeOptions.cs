namespace VeloXML.Infrastructure.Fiscal;

public class FocusNfeOptions
{
    public const string Section = "FocusNfe";
    public string TokenHomologacao { get; set; } = string.Empty;
    public string TokenProducao { get; set; } = string.Empty;
    // Segredo único embutido na URL do webhook registrada na Focus — não há verificação de
    // assinatura documentada por eles, então é o único jeito de validar que a chamada é legítima.
    public string WebhookSecret { get; set; } = string.Empty;
}
