using VeloXML.Domain.Entities;

namespace VeloXML.Application.Common.Interfaces;

// TokenHomologacao/TokenProducao são os tokens ESPECÍFICOS dessa empresa, devolvidos pela
// Focus no cadastro — diferentes do token de conta (global) usado só pra criar/gerenciar
// empresas. É esse par que deve ser usado em toda chamada de emissão pra essa empresa.
public record FocusEmpresaResult(bool Sucesso, string? EmpresaId, string? TokenHomologacao, string? TokenProducao, string? Erro);

// Um item do array "erros" que a Focus devolve numa rejeição — Campo é o path do JSON
// rejeitado (ex.: "itens.1.codigo_ncm"), usado pelo frontend pra explicar o erro e apontar
// pra onde corrigir (produto/cadastro do pedido), em vez de só mostrar o texto cru.
public record FocusNfeCampoErro(string? Campo, string Mensagem);

// Concluida = true quando a Focus já deu uma resposta final (autorizado/rejeitado/erro);
// false enquanto ainda está "processando_autorizacao" — nesse caso Sucesso é sempre false e
// os demais campos ficam vazios, o chamador deve tentar de novo depois (webhook ou polling).
public record FocusNfeSubmissaoResult(
    bool Concluida,
    bool Sucesso,
    string? ChaveAcesso,
    string? Numero,
    string? Serie,
    string? CaminhoXml,
    string? CaminhoDanfe,
    string? MensagemErro,
    string RespostaBrutaJson,
    IReadOnlyList<FocusNfeCampoErro>? ErrosDetalhados = null);

// Cancelamento é síncrono na Focus (diferente da emissão) — a resposta já vem final, sem
// precisar de webhook/polling.
public record FocusNfeCancelamentoResult(bool Sucesso, string? CaminhoXmlCancelamento, string? MensagemErro, string RespostaBrutaJson);

public interface IFocusNfeService
{
    // Registra/atualiza o Cliente como "empresa" na conta Focus NFe da plataforma, habilitando
    // aquele CNPJ pra emissão a partir do certificado A1 enviado.
    Task<FocusEmpresaResult> RegistrarEmpresaAsync(
        Cliente cliente, Stream certificadoPfx, string certificadoSenha, CancellationToken ct = default);

    Task<FocusNfeSubmissaoResult> EmitirNfeAsync(Cliente cliente, string refId, object payload, CancellationToken ct = default);
    Task<FocusNfeSubmissaoResult> ConsultarNfeAsync(Cliente cliente, string refId, CancellationToken ct = default);
    Task<FocusNfeCancelamentoResult> CancelarNfeAsync(Cliente cliente, string refId, string justificativa, CancellationToken ct = default);
    Task<byte[]> BaixarArquivoAsync(Cliente cliente, string caminhoOuUrl, CancellationToken ct = default);
}
