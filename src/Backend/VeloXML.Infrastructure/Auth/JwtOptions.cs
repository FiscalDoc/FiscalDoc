namespace VeloXML.Infrastructure.Auth;

public class JwtOptions
{
    public const string Section = "Jwt";
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = "VeloXML";
    public string Audience { get; set; } = "VeloXML";
    public int ExpiresInMinutes { get; set; } = 60;
    public int RefreshTokenExpiresInDays { get; set; } = 7;
}
