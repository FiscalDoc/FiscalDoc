namespace VeloXML.Application.Common.Interfaces;

public interface ITotpService
{
    string GenerateSecret();
    bool ValidateCode(string secret, string code);
    string GetOtpAuthUri(string secret, string email, string issuer = "VeloXML");
}
