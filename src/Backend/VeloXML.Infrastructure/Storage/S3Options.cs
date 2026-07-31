namespace VeloXML.Infrastructure.Storage;

public class S3Options
{
    public const string Section = "S3";
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Region { get; set; } = "sa-east-1";
    public string BucketName { get; set; } = string.Empty;
}
