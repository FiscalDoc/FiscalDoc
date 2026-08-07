using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Assistente;

// API do Groq é compatível com o formato de chat completions da OpenAI — mesmo shape de
// requisição/resposta (inclusive function/tool calling), só troca a base URL e o nome do modelo.
public sealed class GroqChatService(
    IHttpClientFactory httpFactory, IUnitOfWork uow, ILogger<GroqChatService> logger) : IAssistenteChatService
{
    private const string BaseUrl = "https://api.groq.com/openai/v1";
    private const string Model = "llama-3.3-70b-versatile";

    public async Task<AssistenteResposta?> EnviarAsync(
        string systemPrompt,
        IReadOnlyList<ChatMensagem> historico,
        IReadOnlyList<AssistenteFerramenta>? ferramentas = null,
        CancellationToken ct = default)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(GroqConfigKeys.ApiKey, ct);
        var apiKey = config?.Valor;
        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        var http = httpFactory.CreateClient("groq");
        http.BaseAddress = new Uri(BaseUrl + "/");
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var mensagens = new List<object> { new { role = "system", content = systemPrompt } };
        mensagens.AddRange(historico.Select(MontarMensagem));

        object payload = ferramentas is { Count: > 0 }
            ? new
            {
                model = Model,
                messages = mensagens,
                temperature = 0.3,
                max_tokens = 700,
                tools = ferramentas.Select(f => new
                {
                    type = "function",
                    function = new { name = f.Nome, description = f.Descricao, parameters = f.ParametrosSchema },
                }).ToList(),
            }
            : new { model = Model, messages = mensagens, temperature = 0.3, max_tokens = 700 };

        try
        {
            var resp = await http.PostAsJsonAsync("chat/completions", payload, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning("Groq recusou a chamada do assistente: {Status} {Body}", (int)resp.StatusCode, body);
                return null;
            }

            using var doc = JsonDocument.Parse(body);
            var message = doc.RootElement.GetProperty("choices")[0].GetProperty("message");

            if (message.TryGetProperty("tool_calls", out var toolCallsEl) && toolCallsEl.ValueKind == JsonValueKind.Array && toolCallsEl.GetArrayLength() > 0)
            {
                var tc = toolCallsEl[0];
                var fn = tc.GetProperty("function");
                var chamada = new ChatToolCall(
                    tc.GetProperty("id").GetString()!,
                    fn.GetProperty("name").GetString()!,
                    fn.GetProperty("arguments").GetString() ?? "{}");
                return new AssistenteResposta(null, chamada);
            }

            var texto = message.TryGetProperty("content", out var contentEl) ? contentEl.GetString() : null;
            return new AssistenteResposta(texto, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao chamar o assistente de IA");
            return null;
        }
    }

    private static object MontarMensagem(ChatMensagem m)
    {
        if (m.ToolCalls is { Count: > 0 })
        {
            return new
            {
                role = "assistant",
                content = (string?)null,
                tool_calls = m.ToolCalls.Select(tc => new
                {
                    id = tc.Id,
                    type = "function",
                    function = new { name = tc.Nome, arguments = tc.ArgumentosJson },
                }).ToList(),
            };
        }

        if (m.ToolCallId is not null)
            return new { role = "tool", tool_call_id = m.ToolCallId, content = m.Texto ?? "" };

        return new { role = m.Papel, content = m.Texto ?? "" };
    }
}
