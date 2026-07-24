namespace VeloXML.Infrastructure.Email;

public class EmailOptions
{
    public const string Section = "Email";
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 1025;
    public string From { get; set; } = "noreply@veloxml.com.br";
    public string? Username { get; set; }
    public string? Password { get; set; }
}
