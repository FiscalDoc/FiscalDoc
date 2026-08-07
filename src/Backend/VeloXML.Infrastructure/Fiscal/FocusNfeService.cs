using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Fiscal;

// O token de CONTA (global) é configurado pelo Administrador na tela de Configurações
// (Configuracao, chaves em FocusNfeConfigKeys) e só serve pra criar/gerenciar empresas. Cada
// empresa cadastrada ganha da própria Focus um par de tokens PRÓPRIO (token_producao/
// token_homologacao, devolvidos na resposta do cadastro), que é o que deve autenticar toda
// chamada de emissão/consulta pra esse Cliente especificamente — usar o token de conta nessas
// chamadas dá "Access token inválido" (a Focus não aceita o token de conta pra emitir).
public sealed class FocusNfeService(
    IHttpClientFactory httpFactory,
    IUnitOfWork uow,
    ISecretProtector secretProtector,
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

        var payload = new FocusEmpresaRequest(
            Nome: cliente.RazaoSocial,
            NomeFantasia: cliente.NomeFantasia,
            Cnpj: cliente.Cnpj,
            InscricaoEstadual: cliente.InscricaoEstadual,
            InscricaoMunicipal: cliente.InscricaoMunicipal,
            Logradouro: cliente.Logradouro,
            Numero: cliente.Numero,
            Complemento: cliente.Complemento,
            Bairro: cliente.Bairro,
            Municipio: cliente.Cidade,
            Uf: cliente.Estado,
            Cep: cliente.Cep,
            Telefone: cliente.Telefone,
            Email: cliente.Email,
            RegimeTributario: MapearRegimeTributario(cliente.RegimeTributario),
            HabilitaNfe: true,
            ArquivoCertificadoBase64: certificadoBase64,
            SenhaCertificado: certificadoSenha);

        // Cadastro de empresa é um recurso de CONTA, não de ambiente — confirmado empiricamente:
        // POST /v2/empresas devolve 404 "Endpoint não encontrado" em homologacao.focusnfe.com.br
        // (a rota não existe lá) e 401 (rota existe, só falta auth) em api.focusnfe.com.br. Por
        // isso sempre usa produção aqui, com o token de CONTA (global) — nunca o de uma empresa.
        var http = await CriarClienteContaAsync(ct);
        if (http is null)
            return new FocusEmpresaResult(false, null, null, null, "Token de produção da Focus NFe não configurado. Configure em Configurações > Focus NFe.");

        try
        {
            var resp = await http.PostAsJsonAsync("empresas", payload, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);

            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Focus NFe rejeitou registro de empresa pro cliente {ClienteId}: {Status} {Body}",
                    cliente.Id, (int)resp.StatusCode, body);
                return new FocusEmpresaResult(false, null, null, null, ExtrairMensagemErro(body));
            }

            // A Focus já confirmou o cadastro pelo status HTTP nesse ponto — uma falha ao
            // extrair campos da resposta não pode reverter isso pra "erro", senão um cadastro
            // que deu certo do lado deles aparece como falho aqui (já aconteceu: o "id" volta
            // como número, não string, e um Deserialize<T> tipado quebrava em cima disso).
            var (id, tokenHomologacao, tokenProducao) = ExtrairCamposEmpresa(body);
            return new FocusEmpresaResult(true, id, tokenHomologacao, tokenProducao, null);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao registrar empresa na Focus NFe pro cliente {ClienteId}", cliente.Id);
            return new FocusEmpresaResult(false, null, null, null, "Não foi possível registrar o certificado agora. Tente novamente em instantes.");
        }
    }

    public async Task<FocusNfeSubmissaoResult> EmitirNfeAsync(Cliente cliente, string refId, object payload, CancellationToken ct = default)
    {
        var http = await CriarClienteEmpresaAsync(cliente);
        if (http is null)
            return new FocusNfeSubmissaoResult(true, false, null, null, null, null, null, MensagemTokenEmpresaAusente, "");

        var resp = await http.PostAsJsonAsync($"nfe?ref={Uri.EscapeDataString(refId)}", payload, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        return InterpretarResposta(body);
    }

    public async Task<FocusNfeSubmissaoResult> ConsultarNfeAsync(Cliente cliente, string refId, CancellationToken ct = default)
    {
        var http = await CriarClienteEmpresaAsync(cliente);
        if (http is null)
            return new FocusNfeSubmissaoResult(true, false, null, null, null, null, null, MensagemTokenEmpresaAusente, "");

        var resp = await http.GetAsync($"nfe/{Uri.EscapeDataString(refId)}", ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        return InterpretarResposta(body);
    }

    // DELETE /nfe/{ref} com corpo {"justificativa": "..."} — diferente da emissão/consulta,
    // é síncrono: a Focus já devolve o resultado final da comunicação com a SEFAZ na resposta,
    // sem precisar de polling/webhook.
    public async Task<FocusNfeCancelamentoResult> CancelarNfeAsync(Cliente cliente, string refId, string justificativa, CancellationToken ct = default)
    {
        var http = await CriarClienteEmpresaAsync(cliente);
        if (http is null)
            return new FocusNfeCancelamentoResult(false, null, null, MensagemTokenEmpresaAusente, "");

        using var req = new HttpRequestMessage(HttpMethod.Delete, $"nfe/{Uri.EscapeDataString(refId)}")
        {
            Content = JsonContent.Create(new { justificativa }),
        };
        var resp = await http.SendAsync(req, ct);
        var body = await resp.Content.ReadAsStringAsync(ct);

        CancelamentoStatusResponse? parsed;
        try
        {
            parsed = JsonSerializer.Deserialize<CancelamentoStatusResponse>(body, JsonOpts);
        }
        catch (JsonException)
        {
            return new FocusNfeCancelamentoResult(false, null, null, "Resposta inesperada ao cancelar a NF-e.", body);
        }

        return parsed?.Status == "cancelado"
            ? new FocusNfeCancelamentoResult(true, parsed.CaminhoXmlCancelamento, parsed.NumeroProtocolo, null, body)
            : new FocusNfeCancelamentoResult(false, null, null, parsed?.MensagemSefaz ?? ExtrairMensagemErro(body), body);
    }

    private sealed record CancelamentoStatusResponse(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("status_sefaz")] string? StatusSefaz,
        [property: JsonPropertyName("mensagem_sefaz")] string? MensagemSefaz,
        // Protocolo do EVENTO de cancelamento na SEFAZ — a Focus devolve no mesmo campo
        // "numero_protocolo" usado na resposta de emissão, só que referente a esse evento.
        [property: JsonPropertyName("numero_protocolo")] string? NumeroProtocolo,
        [property: JsonPropertyName("caminho_xml_cancelamento")] string? CaminhoXmlCancelamento);

    public async Task<byte[]> BaixarArquivoAsync(Cliente cliente, string caminhoOuUrl, CancellationToken ct = default)
    {
        var producao = cliente.FocusNfeAmbiente.Equals("producao", StringComparison.OrdinalIgnoreCase);
        var raiz = producao ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
        var url = caminhoOuUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? caminhoOuUrl : raiz + caminhoOuUrl;

        var http = await CriarClienteEmpresaAsync(cliente)
            ?? throw new InvalidOperationException(MensagemTokenEmpresaAusente);
        var resp = await http.GetAsync(url, ct);
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadAsByteArrayAsync(ct);
    }

    private const string MensagemTokenEmpresaAusente =
        "O token desta empresa na Focus NFe ainda não foi salvo. Reenvie o certificado na tela Empresa pra capturá-lo.";

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
                parsed?.MensagemSefaz ?? ExtrairMensagemErro(body), body, ExtrairErrosDetalhados(body)),
        };
    }

    // Token de CONTA (global) — usado só pra criar/gerenciar empresas (POST/GET/PUT /empresas),
    // sempre em produção (ver comentário em RegistrarEmpresaAsync).
    private async Task<HttpClient?> CriarClienteContaAsync(CancellationToken ct)
    {
        var config = await uow.Configuracoes.GetByChaveAsync(FocusNfeConfigKeys.TokenProducao, ct);
        var token = config?.Valor;
        if (string.IsNullOrWhiteSpace(token))
            return null;

        return MontarHttpClient(BaseUrlProducao, token);
    }

    // Token da EMPRESA (por Cliente, salvo em Cliente.FocusNfeTokenHomologacao/Producao) —
    // usado em toda chamada de emissão/consulta/download pra essa empresa específica. Retorna
    // null quando o token daquele ambiente ainda não foi capturado (cliente cadastrado antes
    // dessa mudança, ou cadastro que falhou antes de gravar) — o chamador trata como falha de
    // submissão normal, sem exceção.
    private Task<HttpClient?> CriarClienteEmpresaAsync(Cliente cliente)
    {
        var producao = cliente.FocusNfeAmbiente.Equals("producao", StringComparison.OrdinalIgnoreCase);
        var tokenProtegido = producao ? cliente.FocusNfeTokenProducao : cliente.FocusNfeTokenHomologacao;
        if (string.IsNullOrWhiteSpace(tokenProtegido))
            return Task.FromResult<HttpClient?>(null);

        string token;
        try
        {
            token = secretProtector.Unprotect(tokenProtegido);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao descriptografar o token Focus NFe do cliente {ClienteId}", cliente.Id);
            return Task.FromResult<HttpClient?>(null);
        }

        return Task.FromResult<HttpClient?>(MontarHttpClient(producao ? BaseUrlProducao : BaseUrlHomologacao, token));
    }

    private HttpClient MontarHttpClient(string baseUrl, string token)
    {
        var http = httpFactory.CreateClient("focus-nfe");
        http.BaseAddress = new Uri(baseUrl + "/");
        http.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{token}:")));
        return http;
    }

    // Códigos confirmados na doc da Focus: 1=Simples Nacional, 2=Simples c/ excesso, 3=Normal
    // (Lucro Presumido/Real), 4=MEI.
    private static int MapearRegimeTributario(string? regime) => regime switch
    {
        "LucroReal" => 3,
        "LucroPresumido" => 3,
        "Mei" => 4,
        _ => 1, // Simples Nacional (inclui o valor legado "SimpesNacional")
    };

    // A "mensagem" de topo da Focus costuma ser só um rótulo genérico ("Erro de validação") —
    // o motivo de verdade fica no array "erros", um objeto {campo, mensagem} por problema.
    // Sem isso, o usuário só via "Erro de validação" sem nenhuma pista do que corrigir.
    private static string? ExtrairMensagemErro(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var mensagemTopo = doc.RootElement.TryGetProperty("mensagem", out var msg) ? msg.GetString() : null;

            if (doc.RootElement.TryGetProperty("erros", out var erros) && erros.ValueKind == JsonValueKind.Array)
            {
                var detalhes = erros.EnumerateArray()
                    .Select(e =>
                    {
                        var campo = e.TryGetProperty("campo", out var c) ? c.GetString() : null;
                        var mensagemCampo = e.TryGetProperty("mensagem", out var m) ? m.GetString() : e.ToString();
                        return string.IsNullOrEmpty(campo) ? mensagemCampo : $"{campo}: {mensagemCampo}";
                    })
                    .Where(s => !string.IsNullOrWhiteSpace(s));

                var junto = string.Join(" | ", detalhes);
                if (!string.IsNullOrWhiteSpace(junto))
                    return string.IsNullOrEmpty(mensagemTopo) ? junto : $"{mensagemTopo}: {junto}";
            }

            if (!string.IsNullOrEmpty(mensagemTopo))
                return mensagemTopo;
        }
        catch (JsonException) { /* corpo não é JSON — usa o texto cru */ }
        return body;
    }

    // Mesma leitura do array "erros" que ExtrairMensagemErro, mas devolvendo os pares
    // campo/mensagem estruturados em vez de um texto já concatenado — é isso que o frontend
    // usa pra montar o modal de erro com explicação e link de correção por campo.
    private static List<FocusNfeCampoErro> ExtrairErrosDetalhados(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("erros", out var erros) || erros.ValueKind != JsonValueKind.Array)
                return [];

            return erros.EnumerateArray()
                .Select(e =>
                {
                    var campo = e.TryGetProperty("campo", out var c) ? c.GetString() : null;
                    var mensagemCampo = (e.TryGetProperty("mensagem", out var m) ? m.GetString() : null) ?? e.ToString();
                    return new FocusNfeCampoErro(campo, mensagemCampo);
                })
                .ToList();
        }
        catch (JsonException)
        {
            return [];
        }
    }

    // Lê id/token_producao/token_homologacao manualmente (em vez de um tipo forte) porque a
    // Focus devolve "id" como número, não string — ler via JsonDocument aceita qualquer
    // formato sem arriscar exceção (já aconteceu quebrar com Deserialize<T> tipado).
    private static (string? Id, string? TokenHomologacao, string? TokenProducao) ExtrairCamposEmpresa(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            string? id = null;
            if (root.TryGetProperty("id", out var idEl))
                id = idEl.ValueKind == JsonValueKind.String ? idEl.GetString() : idEl.GetRawText();

            string? tokenHomologacao = root.TryGetProperty("token_homologacao", out var th) ? th.GetString() : null;
            string? tokenProducao = root.TryGetProperty("token_producao", out var tp) ? tp.GetString() : null;

            return (id, tokenHomologacao, tokenProducao);
        }
        catch (JsonException)
        {
            return (null, null, null);
        }
    }

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private sealed record FocusEmpresaRequest(
        [property: JsonPropertyName("nome")] string Nome,
        [property: JsonPropertyName("nome_fantasia")] string? NomeFantasia,
        [property: JsonPropertyName("cnpj")] string Cnpj,
        [property: JsonPropertyName("inscricao_estadual")] string? InscricaoEstadual,
        [property: JsonPropertyName("inscricao_municipal")] string? InscricaoMunicipal,
        [property: JsonPropertyName("logradouro")] string? Logradouro,
        [property: JsonPropertyName("numero")] string? Numero,
        [property: JsonPropertyName("complemento")] string? Complemento,
        [property: JsonPropertyName("bairro")] string? Bairro,
        [property: JsonPropertyName("municipio")] string? Municipio,
        [property: JsonPropertyName("uf")] string? Uf,
        [property: JsonPropertyName("cep")] string? Cep,
        [property: JsonPropertyName("telefone")] string? Telefone,
        [property: JsonPropertyName("email")] string? Email,
        [property: JsonPropertyName("regime_tributario")] int RegimeTributario,
        [property: JsonPropertyName("habilita_nfe")] bool HabilitaNfe,
        [property: JsonPropertyName("arquivo_certificado_base64")] string ArquivoCertificadoBase64,
        [property: JsonPropertyName("senha_certificado")] string SenhaCertificado);

    private sealed record FocusNfeStatusResponse(
        [property: JsonPropertyName("status")] string? Status,
        [property: JsonPropertyName("chave_nfe")] string? ChaveNfe,
        [property: JsonPropertyName("numero")] string? Numero,
        [property: JsonPropertyName("serie")] string? Serie,
        [property: JsonPropertyName("caminho_xml_nota_fiscal")] string? CaminhoXmlNotaFiscal,
        [property: JsonPropertyName("caminho_danfe")] string? CaminhoDanfe,
        [property: JsonPropertyName("mensagem_sefaz")] string? MensagemSefaz);
}
