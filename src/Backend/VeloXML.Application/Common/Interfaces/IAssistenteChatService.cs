namespace VeloXML.Application.Common.Interfaces;

// Papel: "user" | "assistant" — mesma convenção da API do Groq (compatível com o formato OpenAI).
public record ChatMensagem(string Papel, string Texto);

public interface IAssistenteChatService
{
    // Retorna null quando a chave não está configurada ou a chamada falha — o chamador decide
    // a mensagem de erro amigável, esse serviço só sabe "deu certo ou não".
    Task<string?> EnviarAsync(string systemPrompt, IReadOnlyList<ChatMensagem> historico, CancellationToken ct = default);
}
