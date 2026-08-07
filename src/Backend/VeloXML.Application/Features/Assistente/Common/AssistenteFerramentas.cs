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
        new(
            "cadastrar_pedido",
            "Cria um novo pedido/nota fiscal pro cliente atual. Antes de chamar, use buscar_destinatarios pra achar o destinatarioId e buscar_produtos pra achar o produtoId de cada item — nunca invente IDs. SEMPRE chame primeiro com confirmado=false pra mostrar um resumo (destinatário, itens, valor total) e pedir confirmação explícita do usuário; só chame de novo com confirmado=true (mesmos dados) depois que o usuário confirmar na conversa.",
            new
            {
                type = "object",
                properties = new
                {
                    destinatarioId = new { type = "string", description = "Id do destinatário (achado via buscar_destinatarios)" },
                    itens = new
                    {
                        type = "array",
                        description = "Itens do pedido",
                        items = new
                        {
                            type = "object",
                            properties = new
                            {
                                produtoId = new { type = "string", description = "Id do produto (achado via buscar_produtos)" },
                                quantidade = new { type = "number" },
                                precoUnitario = new { type = "number", description = "Opcional — se omitido, usa o preço de venda cadastrado do produto" },
                                desconto = new { type = "number", description = "Desconto em reais no item, opcional" },
                            },
                            required = new[] { "produtoId", "quantidade" },
                        },
                    },
                    naturezaOperacao = new { type = "string", description = "Opcional — padrão \"Venda de mercadoria\"" },
                    observacoes = new { type = "string", description = "Observações do pedido, opcional" },
                    confirmado = new { type = "boolean", description = "true somente depois que o usuário confirmou explicitamente os dados na conversa" },
                },
                required = new[] { "destinatarioId", "itens", "confirmado" },
            }),
        new(
            "buscar_produtos",
            "Busca produtos já cadastrados do cliente atual pelo nome ou código. Use antes de cadastrar_pedido pra achar o produtoId certo, ou pra responder perguntas do tipo \"qual o preço do produto X\".",
            new
            {
                type = "object",
                properties = new { termo = new { type = "string", description = "Nome ou código (ou parte) do produto" } },
                required = new[] { "termo" },
            }),
        new(
            "buscar_destinatarios",
            "Busca destinatários (clientes que recebem nota fiscal) já cadastrados do cliente atual, pelo nome ou CPF/CNPJ. Use antes de cadastrar_pedido pra achar o destinatarioId certo.",
            new
            {
                type = "object",
                properties = new { termo = new { type = "string", description = "Nome ou CPF/CNPJ (ou parte) do destinatário" } },
                required = new[] { "termo" },
            }),
        new(
            "buscar_usuarios",
            "Busca usuários de acesso já cadastrados do cliente atual, pelo nome ou e-mail.",
            new
            {
                type = "object",
                properties = new { termo = new { type = "string", description = "Nome ou e-mail (ou parte) do usuário" } },
                required = new[] { "termo" },
            }),
        new(
            "buscar_pedidos",
            "Busca pedidos/notas fiscais já existentes do cliente atual, por número, nome do destinatário e/ou status.",
            new
            {
                type = "object",
                properties = new
                {
                    termo = new { type = "string", description = "Número do pedido ou nome do destinatário, opcional" },
                    status = new { type = "string", @enum = new[] { "Rascunho", "Autorizada", "Cancelada" }, description = "Filtro de status, opcional" },
                },
                required = Array.Empty<string>(),
            }),
        new(
            "top_produtos",
            "Lista os produtos mais vendidos (por valor faturado) num período, pra responder perguntas tipo \"quais os produtos mais vendidos desse mês/trimestre\".",
            new
            {
                type = "object",
                properties = new
                {
                    de = new { type = "string", description = "Data inicial no formato AAAA-MM-DD" },
                    ate = new { type = "string", description = "Data final no formato AAAA-MM-DD" },
                    limite = new { type = "number", description = "Quantos produtos retornar, padrão 5" },
                },
                required = new[] { "de", "ate" },
            }),
        new(
            "top_destinatarios",
            "Lista os destinatários (clientes/compradores) que mais compraram (por valor faturado) num período, pra responder perguntas tipo \"quem são meus maiores clientes\".",
            new
            {
                type = "object",
                properties = new
                {
                    de = new { type = "string", description = "Data inicial no formato AAAA-MM-DD" },
                    ate = new { type = "string", description = "Data final no formato AAAA-MM-DD" },
                    limite = new { type = "number", description = "Quantos destinatários retornar, padrão 5" },
                },
                required = new[] { "de", "ate" },
            }),
        new(
            "faturamento_periodo",
            "Calcula o faturamento total (NF-e autorizadas, excluindo canceladas) num período arbitrário de datas — use pra perguntas sobre um mês específico, trimestre, ano, ou qualquer intervalo que não seja o mês corrente (esse já vem pronto no contexto).",
            new
            {
                type = "object",
                properties = new
                {
                    de = new { type = "string", description = "Data inicial no formato AAAA-MM-DD" },
                    ate = new { type = "string", description = "Data final no formato AAAA-MM-DD" },
                },
                required = new[] { "de", "ate" },
            }),
    };
}
