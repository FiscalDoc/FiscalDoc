using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Application.Features.Assistente.Common;

// Ferramentas que o assistente pode "chamar" via function-calling do Groq. Todas seguem o mesmo
// padrão confirmar-então-executar: o parâmetro "confirmado" só deve vir true depois que o
// usuário confirmou explicitamente na conversa os dados que serão gravados — o executor
// (AssistenteAcaoExecutor) nunca grava nada em confirmado=false, só devolve um resumo pro
// modelo repassar como pergunta de confirmação.
internal static class AssistenteFerramentas
{
    public static readonly IReadOnlyList<AssistenteFerramenta> Todas = new List<AssistenteFerramenta>
    {
        new(
            "cadastrar_produto",
            "Cadastra um novo produto no sistema do cliente atual. SEMPRE chame primeiro com confirmado=false pra mostrar um resumo dos dados e pedir confirmação explícita do usuário; só chame de novo com confirmado=true (mesmos dados) depois que o usuário confirmar na conversa.",
            new
            {
                type = "object",
                properties = new
                {
                    codigo = new { type = "string", description = "Código/SKU do produto" },
                    descricao = new { type = "string", description = "Nome/descrição do produto" },
                    unidade = new { type = "string", description = "Unidade de medida, ex: UN, KG, CX, L" },
                    precoUnitario = new { type = "number", description = "Preço de venda em reais" },
                    confirmado = new { type = "boolean", description = "true somente depois que o usuário confirmou explicitamente os dados na conversa" },
                },
                required = new[] { "codigo", "descricao", "unidade", "precoUnitario", "confirmado" },
            }),
        new(
            "cadastrar_destinatario",
            "Cadastra um novo destinatário (cliente que recebe a nota fiscal, com CPF/CNPJ e endereço) pro cliente atual. SEMPRE chame primeiro com confirmado=false pra mostrar um resumo dos dados e pedir confirmação explícita do usuário; só chame de novo com confirmado=true (mesmos dados) depois que o usuário confirmar na conversa.",
            new
            {
                type = "object",
                properties = new
                {
                    razaoSocial = new { type = "string", description = "Razão social (empresa) ou nome completo (pessoa física)" },
                    cpfCnpj = new { type = "string", description = "CPF ou CNPJ do destinatário, se informado" },
                    email = new { type = "string", description = "E-mail de contato, se informado" },
                    telefone = new { type = "string", description = "Telefone de contato, se informado" },
                    cidade = new { type = "string", description = "Cidade, se informada" },
                    estado = new { type = "string", description = "UF (sigla de 2 letras), se informada" },
                    confirmado = new { type = "boolean", description = "true somente depois que o usuário confirmou explicitamente os dados na conversa" },
                },
                required = new[] { "razaoSocial", "confirmado" },
            }),
        new(
            "cadastrar_usuario",
            "Cadastra um novo usuário de acesso pro cliente atual — a pessoa recebe um e-mail de convite pra definir a própria senha, não precisa informar senha aqui. SEMPRE chame primeiro com confirmado=false pra mostrar um resumo dos dados e pedir confirmação explícita do usuário; só chame de novo com confirmado=true (mesmos dados) depois que o usuário confirmar na conversa.",
            new
            {
                type = "object",
                properties = new
                {
                    nome = new { type = "string", description = "Nome completo do usuário" },
                    email = new { type = "string", description = "E-mail do usuário (recebe o convite de primeiro acesso)" },
                    confirmado = new { type = "boolean", description = "true somente depois que o usuário confirmou explicitamente os dados na conversa" },
                },
                required = new[] { "nome", "email", "confirmado" },
            }),
    };
}
