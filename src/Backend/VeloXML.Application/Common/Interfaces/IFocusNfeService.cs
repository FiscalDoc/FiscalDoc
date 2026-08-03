using VeloXML.Domain.Entities;

namespace VeloXML.Application.Common.Interfaces;

public record FocusEmpresaResult(bool Sucesso, string? EmpresaId, string? Erro);

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
    string RespostaBrutaJson);

public interface IFocusNfeService
{
    // Registra/atualiza o Cliente como "empresa" na conta Focus NFe da plataforma, habilitando
    // aquele CNPJ pra emissão a partir do certificado A1 enviado.
    Task<FocusEmpresaResult> RegistrarEmpresaAsync(
        Cliente cliente, Stream certificadoPfx, string certificadoSenha, CancellationToken ct = default);

    Task<FocusNfeSubmissaoResult> EmitirNfeAsync(Cliente cliente, string refId, object payload, CancellationToken ct = default);
    Task<FocusNfeSubmissaoResult> ConsultarNfeAsync(Cliente cliente, string refId, CancellationToken ct = default);
    Task<byte[]> BaixarArquivoAsync(Cliente cliente, string caminhoOuUrl, CancellationToken ct = default);
}
