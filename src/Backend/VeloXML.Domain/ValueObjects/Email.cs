using System.Text.RegularExpressions;

namespace VeloXML.Domain.ValueObjects;

public sealed record Email
{
    private static readonly Regex Pattern = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

    public string Value { get; }

    private Email(string value) => Value = value;

    public static Email Create(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("E-mail não pode ser vazio.");

        var normalized = email.Trim().ToLowerInvariant();

        if (!Pattern.IsMatch(normalized))
            throw new ArgumentException("E-mail inválido.");

        return new Email(normalized);
    }

    public override string ToString() => Value;
    public static implicit operator string(Email email) => email.Value;
}
