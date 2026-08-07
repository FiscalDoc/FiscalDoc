using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Assistente.Common;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Assistente.Commands.EnviarMensagem;

public sealed class EnviarMensagemAssistenteCommandHandler(IUnitOfWork uow, IAssistenteChatService chat)
    : IRequestHandler<EnviarMensagemAssistenteCommand, Result<string>>
{
    // Limite curto de propósito: o histórico inteiro vai no prompt a cada chamada (sem
    // gerenciamento de sessão no servidor), então uma conversa muito longa infla custo/latência
    // à toa — 20 mensagens é mais que suficiente pro escopo de "me ajuda a entender o que falta".
    private const int MaxMensagens = 20;

    public async Task<Result<string>> Handle(EnviarMensagemAssistenteCommand request, CancellationToken ct)
    {
        if (request.Mensagens.Count == 0)
            return Result.Failure<string>(ResultError.Validation("Mensagens", "Envie ao menos uma mensagem."));

        var contexto = await DiagnosticoContextoBuilder.MontarAsync(uow, request.ClienteId, request.PedidoId, ct);

        var systemPrompt = $$"""
            Você é o assistente virtual do FiscalDoc, um sistema de gestão fiscal e emissão de NF-e usado por contadores e seus clientes.

            Regras:
            - Responda sempre em português do Brasil, de forma direta e prática, em poucas frases.
            - Ajude o usuário a entender o que falta pra emitir uma nota fiscal, apontando exatamente qual tela ele precisa acessar (ex.: "tela Empresa, aba Fiscal", "cadastro do produto").
            - Explique termos fiscais (CST, CFOP, NCM, IBS/CBS, regime tributário) de forma simples quando perguntado.
            - Perguntas sobre números do negócio (faturamento, quantidade de notas emitidas, notas canceladas etc.) — responda direto usando os "Dados financeiros reais" abaixo, já calculados pro cliente atual. Nunca invente ou estime um valor: se a pergunta pedir algo que não está nesses dados (ex.: um mês específico que não seja o corrente, ou um produto específico), diga que essa informação não está disponível aqui e sugira a tela Relatórios.
            - Você NÃO executa nenhuma ação no sistema — só orienta. Nunca diga que vai "fazer" ou "corrigir" algo, sempre diga ao usuário o que ELE precisa fazer e onde.
            - Nunca mencione nomes de fornecedores/provedores terceiros usados internamente pelo sistema (ex.: qualquer serviço usado nos bastidores pra emissão de NF-e) — pro usuário, é sempre o FiscalDoc que emite a nota.

            Contexto atual do usuário no sistema:
            {{contexto}}
            """;

        var mensagens = request.Mensagens.TakeLast(MaxMensagens).Select(m => new ChatMensagem(m.Papel, m.Texto)).ToList();
        var resposta = await chat.EnviarAsync(systemPrompt, mensagens, ct);

        if (resposta is null)
            return Result.Failure<string>(ResultError.Validation(
                "Assistente", "O assistente ainda não está configurado ou está indisponível no momento. Peça pro Administrador configurar em Configurações."));

        return Result.Success(resposta);
    }
}
