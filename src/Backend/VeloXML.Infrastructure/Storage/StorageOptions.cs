namespace VeloXML.Infrastructure.Storage;

public class StorageOptions
{
    public const string Section = "Storage";
    public string Endpoint { get; set; } = "localhost:9000";
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSSL { get; set; }
}
