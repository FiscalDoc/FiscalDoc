namespace VeloXML.Application.Common;

public static class StorageKeyHelper
{
    /// <summary>
    /// Chave do objeto pra arquivos de documento fiscal, organizada por empresa/ano/mês/dia:
    /// {cnpjLimpo}/{ano}/{mes}/{dia}/{chaveAcesso}.{extensao} — usa a chave de acesso da NFe/CTe
    /// (44 dígitos, já única) como nome do arquivo; sem chave de acesso, usa um Guid novo.
    /// </summary>
    public static string MontarChaveDocumento(string cnpj, DateTime dataEmissao, string? chaveAcesso, string extensao = "xml")
    {
        var cnpjLimpo = new string(cnpj.Where(char.IsDigit).ToArray());
        var nomeArquivo = string.IsNullOrWhiteSpace(chaveAcesso) ? Guid.NewGuid().ToString() : chaveAcesso;
        return $"{cnpjLimpo}/{dataEmissao:yyyy}/{dataEmissao:MM}/{dataEmissao:dd}/{nomeArquivo}.{extensao}";
    }
}
