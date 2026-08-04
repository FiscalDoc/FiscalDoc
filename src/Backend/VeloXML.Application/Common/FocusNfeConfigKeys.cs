namespace VeloXML.Application.Common;

// Chaves usadas na tabela Configuracao (Chave/Valor) pra guardar as credenciais da Focus NFe —
// configuradas pelo Administrador direto na tela de Configurações, não por variável de
// ambiente, já que são um dado que o próprio Admin cadastra/atualiza pelo sistema.
public static class FocusNfeConfigKeys
{
    public const string TokenHomologacao = "focusnfe.token_homologacao";
    public const string TokenProducao = "focusnfe.token_producao";
    public const string WebhookSecret = "focusnfe.webhook_secret";
}
