using System.Text.RegularExpressions;

namespace VeloXML.Domain.ValueObjects;

public sealed record Cpf
{
    private static readonly Regex OnlyDigits = new(@"\D", RegexOptions.Compiled);

    public string Value { get; }

    private Cpf(string value) => Value = value;

    public static Cpf Create(string cpf)
    {
        var digits = OnlyDigits.Replace(cpf ?? string.Empty, "");

        if (digits.Length != 11 || digits.Distinct().Count() == 1)
            throw new ArgumentException("CPF inválido.");

        static int Calc(string s, int start) =>
            s.Take(start).Select((c, i) => (c - '0') * (start + 1 - i)).Sum() % 11;

        static int Digit(int r) => r < 2 ? 0 : 11 - r;

        if (Digit(Calc(digits, 9)) != digits[9] - '0') throw new ArgumentException("CPF inválido.");
        if (Digit(Calc(digits, 10)) != digits[10] - '0') throw new ArgumentException("CPF inválido.");

        return new Cpf(digits);
    }

    public string Formatted => $"{Value[..3]}.{Value[3..6]}.{Value[6..9]}-{Value[9..]}";
    public override string ToString() => Value;
    public static implicit operator string(Cpf cpf) => cpf.Value;
}
