namespace VeloXML.Infrastructure.Cache;

public class CacheOptions
{
    public const string Section = "Redis";
    public string ConnectionString { get; set; } = "localhost:6379";
    public int DefaultExpiryMinutes { get; set; } = 30;
}
