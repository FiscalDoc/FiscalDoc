namespace VeloXML.Application.Common.Interfaces;

// Papel: "user" | "assistant" — mesma convenção da API do Groq (compatível com o formato OpenAI).
// ToolCalls preenchido só numa mensagem "assistant" que pediu pra chamar uma ferramenta;
// ToolCallId preenchido só numa mensagem "tool" (resultado de uma ferramenta) respondendo a ela.
public record ChatMensagem(string Papel, string? Texto, IReadOnlyList<ChatToolCall>? ToolCalls = null, string? ToolCallId = null);

public record ChatToolCall(string Id, string Nome, string ArgumentosJson);

// ParametrosSchema é serializado como o JSON Schema do parâmetro "parameters" da function-calling
// da OpenAI/Groq — normalmente um objeto anônimo com { type = "object", properties = ..., required = ... }.
public record AssistenteFerramenta(string Nome, string Descricao, object ParametrosSchema);

// Texto preenchido quando o modelo respondeu em linguagem natural; ChamadaFerramenta preenchida
// quando o modelo pediu pra executar uma ferramenta (mutuamente exclusivos).
public record AssistenteResposta(string? Texto, ChatToolCall? ChamadaFerramenta);

public interface IAssistenteChatService
{
    // Retorna null SÓ quando a chave não está configurada (estado esperado, não é erro) — pra
    // falha de verdade (Groq recusou a chamada, timeout, exceção) usa AssistenteIndisponivelException,
    // porque "não configurado" e "configurado mas falhou agora" pedem mensagens bem diferentes
    // pro usuário (um aponta pro Administrador configurar, o outro só pede pra tentar de novo).
    Task<AssistenteResposta?> EnviarAsync(
        string systemPrompt,
        IReadOnlyList<ChatMensagem> historico,
        IReadOnlyList<AssistenteFerramenta>? ferramentas = null,
        CancellationToken ct = default);
}

// Chave configurada, mas a chamada em si falhou (Groq recusou, timeout, erro de rede etc.) —
// diferente de "não configurado", que é um estado esperado e não uma falha.
public sealed class AssistenteIndisponivelException(string motivo) : Exception(motivo);
