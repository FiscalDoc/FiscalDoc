using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace VeloXML.Application.Common;

public static partial class SlugHelper
{
    public static string Gerar(string texto)
    {
        var semAcentos = RemoverAcentos(texto.ToLowerInvariant());
        var comHifens = NaoAlfanumerico().Replace(semAcentos, "-");
        var colapsado = HifensRepetidos().Replace(comHifens, "-");
        return colapsado.Trim('-');
    }

    private static string RemoverAcentos(string texto)
    {
        var normalizado = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalizado)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NaoAlfanumerico();

    [GeneratedRegex(@"-+")]
    private static partial Regex HifensRepetidos();
}
