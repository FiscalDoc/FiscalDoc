using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;

namespace VeloXML.Infrastructure.Fiscal;

public sealed class FocusNfeService(
    IHttpClientFactory httpFactory,
    IOptions<FocusNfeOptions> opts,
    ILogger<FocusNfeService> logger) : IFocusNfeService
{
    private const string BaseUrlProducao = "https://api.focusnfe.com.br/v2";
    private const string BaseUrlHomologacao = "https://homologacao.focusnfe.com.br/v2";

    public async Task<FocusEmpresaResult> RegistrarEmpresaAsync(
        Cliente cliente, Stream certificadoPfx, string certificadoSenha, CancellationToken ct = default)
    {
        using var ms = new MemoryStream();
        await certificadoPfx.CopyToAsync(ms, ct);
        var certificadoBase64 = Convert.ToBase64String(ms.ToArray());

        // Schema baseado na documentação pública da Focus NFe — precisa ser confirmado/ajustado
        // contra a conta real de homologação assim que criada (ver plano, questão em aberto #1).
        var payload = new FocusEmpresaRequest(
            Nome: cliente.RazaoSocial,
            NomeFantasia: cliente.NomeFantasia,
            Cnpj: cliente.Cnpj,
            InscricaoEstadual: cliente.InscricaoEstadual,
            InscricaoMunicipal: cliente.InscricaoMunicipal,
            Municipio: cliente.Cidade,
            Uf: cliente.Estado,
            RegimeTributario: MapearRegimeTributario(cliente.RegimeTributario),
            HabilitaNfe: true,
            ArquivoCertificadoBase64: certificadoBase64,
            SenhaCertificado: certificadoSenha);

        var http = CriarCliente(cliente.FocusNfeAmbiente);

        try
        {
            var resp = await http.PostAsJsonAsync("empresas", payload, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Focus NFe rejeitou registro de empresa pro cliente {ClienteId}: {Status} {Body}",
                    cliente.Id, (int)resp.StatusCode, body);
                return new FocusEmpresaResult(false, null, ExtrairMensagemErro(body));
            }

            var resultado = JsonSerializer.Deserialize<FocusEmpresaResponse>(body, JsonOpts);
            return new FocusEmpresaResult(true, resultado?.Id, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao registrar empresa na Focus NFe pro cliente {ClienteId}", cliente.Id);
            return new FocusEmpresaResult(false, null, "Não foi possível registrar o certificado agora. Tente novamente em instantes.");
        }
    }

    public async Task<FocusNfeSubmissaoResult> EmitirNfeAsync(Cliente cliente, string refId, object payload, CancellationToken ct = default)
    {
        var http = CriarCliente(cliente.FocusNfeAmbiente);
        var resp = await http.PostAsJsonAsync($"nfe?ref={Uri.EscapeDataString(refId)}", payload, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        return InterpretarResposta(body);
    }

    public async Task<FocusNfeSubmissaoResult> ConsultarNfeAsync(Cliente cliente, string refId, CancellationToken ct = default)
    {
        var http = CriarCliente(cliente.FocusNfeAmbiente);
        var resp = await http.GetAsync($"nfe/{Uri.EscapeDataString(refId)}", ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        return InterpretarResposta(body);
    }

    public async Task<byte[]> BaixarArquivoAsync(Cliente cliente, string caminhoOuUrl, CancellationToken ct = default)
    {
        var producao = cliente.FocusNfeAmbiente.Equals("producao", StringComparison.OrdinalIgnoreCase);
        var raiz = producao ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
        var url = caminhoOuUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? caminhoOuUrl : raiz + caminhoOuUrl;

        var http = CriarCliente(cliente.FocusNfeAmbiente);
        var resp = await http.GetAsync(url, ct);
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadAsByteArrayAsync(ct);
    }

    // Schema de resposta baseado na documentação pública da Focus NFe — assim como o registro
    // de empresa, precisa ser confirmado/ajustado contra a conta real (ver plano).
    private static FocusNfeSubmissaoResult InterpretarResposta(string body)
    {
        FocusNfeStatusResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<FocusNfeStatusResponse>(body, JsonOpts);
        }
        catch (JsonException)
        {
            return new FocusNfeSubmissaoResult(true, false, null, null, null, null, null, "Resposta inesperada ao consultar a emissão.", body);
        }

        return parsed?.Status switch
        {
            "autorizado" => new FocusNfeSubmissaoResult(
                true, true, parsed.ChaveNfe, parsed.Numero, parsed.Serie,
                parsed.CaminhoXmlNotaFiscal, parsed.CaminhoDanfe, null, body),
            "processando_autorizacao" => new FocusNfeSubmissaoResult(
                false, false, null, null, null, null, null, null, body),
            _ => new FocusNfeSubmissaoResult(
                true, false, null, null, null, null, null,
                parsed?.MensagemSefaz ?? ExtrairMensagemErro(body), body),
        };
    }

    private HttpClient CriarCliente(string ambiente)
    {
        var producao = ambiente.Equals("producao", StringComparison.OrdinalIgnoreCase);
        var token = producao ? opts.Value.TokenProducao : opts.Value.TokenHomologacao;

        var http = httpFactory.CreateClient("focus-nfe");
        http.BaseAddress = new Uri((producao ? BaseUrlProducao : BaseUrlHomologacao) + "/");
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{token}:")));
        return http;
    }

    private static string MapearRegimeTributario(string? regime) => regime switch
    {
        "LucroReal" => "3",
        "LucroPresumido" => "3",
        "Mei" => "1",
        _ => "1", // Simples Nacional (inclui o valor legado "SimpesNacional")
    };

    private static string? ExtrairMensagemErro(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("mensagem", out var msg))
                return msg.GetString();
            if (doc.RootElement.TryGetProperty("erros", out var erros))
                return erros.ToString();
        }
        catch (JsonException) { /* corpo não é JSON — usa o texto cru */ }
        return body;
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private sealed record FocusEmpresaRequest(
        [property: JsonPropertyName("nome")] string Nome,
        [property: JsonPropertyName("nome_fantasia")] string? NomeFantasia,
        [property: JsonPropertyName("cnpj")] string Cnpj,
        [property: JsonPropertyName("inscricao_estadual")] string? InscricaoEstadual,
        [property: JsonPropertyName("inscricao_municipal")] string? InscricaoMunicipal,
        [property: JsonPropertyName("municipio")] string? Municipio,
        [property: JsonPropertyName("uf")] string? Uf,
        [property: JsonPropertyName("regime_tributario")] string RegimeTributario,
        [property: JsonPropertyName("habilita_nfe")] bool HabilitaNfe,
        [property: JsonPropertyName("arquivo_certificado_base64")] string ArquivoCertificadoBase64,
        [property: JsonPropertyName("senha_certificado")] string SenhaCertificado);

    private sealed record FocusEmpresaResponse([property: JsonPropertyName("id")] string? Id);

    private sealed record FocusNfeStatusResponse(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("chave_nfe")] string? ChaveNfe,
        [property: JsonPropertyName("numero")] string? Numero,
        [property: JsonPropertyName("serie")] string? Serie,
        [property: JsonPropertyName("caminho_xml_nota_fiscal")] string? CaminhoXmlNotaFiscal,
        [property: JsonPropertyName("caminho_danfe")] string? CaminhoDanfe,
        [property: JsonPropertyName("mensagem_sefaz")] string? MensagemSefaz);
}
