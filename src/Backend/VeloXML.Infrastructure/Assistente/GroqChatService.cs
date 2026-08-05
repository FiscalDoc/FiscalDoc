using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Assistente;

// API do Groq é compatível com o formato de chat completions da OpenAI — mesmo shape de
// requisição/resposta, só troca a base URL e o nome do modelo.
public sealed class GroqChatService(
    IHttpClientFactory httpFactory, IUnitOfWork uow, ILogger<GroqChatService> logger) : IAssistenteChatService
{
    private const string BaseUrl = "https://api.groq.com/openai/v1";
    private const string Model = "llama-3.3-70b-versatile";

    public async Task<string?> EnviarAsync(string systemPrompt, IReadOnlyList<ChatMensagem> historico, CancellationToken ct = default)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(GroqConfigKeys.ApiKey, ct);
        var apiKey = config?.Valor;
        if (string.IsNullOrWhiteSpace(apiKey))
            return null;

        var http = httpFactory.CreateClient("groq");
        http.BaseAddress = new Uri(BaseUrl + "/");
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var mensagens = new List<object> { new { role = "system", content = systemPrompt } };
        mensagens.AddRange(historico.Select(m => new { role = m.Papel, content = m.Texto }));

        var payload = new { model = Model, messages = mensagens, temperature = 0.3, max_tokens = 700 };

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
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao chamar o assistente de IA");
            return null;
        }
    }
}
