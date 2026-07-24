using OtpNet;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Auth;

public sealed class TotpService : ITotpService
{
    public string GenerateSecret()
    {
        var key = KeyGeneration.GenerateRandomKey(20);
        return Base32Encoding.ToString(key);
    }

    public bool ValidateCode(string secret, string code)
    {
        if (!int.TryParse(code, out _)) return false;
        var key = Base32Encoding.ToBytes(secret);
        var totp = new Totp(key);
        return totp.VerifyTotp(code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);
    }

    public string GetOtpAuthUri(string secret, string email, string issuer = "VeloXML")
    {
        var encodedIssuer = Uri.EscapeDataString(issuer);
        var encodedEmail  = Uri.EscapeDataString(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}?secret={secret}&issuer={encodedIssuer}&algorithm=SHA1&digits=6&period=30";
    }
}
