using System.Text.RegularExpressions;

namespace VeloXML.Domain.ValueObjects;

public sealed record Cnpj
{
    private static readonly Regex OnlyDigits = new(@"\D", RegexOptions.Compiled);

    public string Value { get; }

    private Cnpj(string value) => Value = value;

    public static Cnpj Create(string cnpj)
    {
        var digits = OnlyDigits.Replace(cnpj ?? string.Empty, "");

        if (digits.Length != 14 || digits.Distinct().Count() == 1)
            throw new ArgumentException("CNPJ inválido.");

        if (!ValidateDigits(digits))
            throw new ArgumentException("CNPJ inválido.");

        return new Cnpj(digits);
    }

    private static bool ValidateDigits(string d)
    {
        int[] w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        int[] w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

        static int Calc(string s, int[] w) => s.Select((c, i) => (c - '0') * w[i]).Sum() % 11;
        static int Digit(int r) => r < 2 ? 0 : 11 - r;

        return Digit(Calc(d, w1)) == d[12] - '0'
            && Digit(Calc(d, w2)) == d[13] - '0';
    }

    public string Formatted => $"{Value[..2]}.{Value[2..5]}.{Value[5..8]}/{Value[8..12]}-{Value[12..]}";
    public override string ToString() => Value;
    public static implicit operator string(Cnpj cnpj) => cnpj.Value;
}
