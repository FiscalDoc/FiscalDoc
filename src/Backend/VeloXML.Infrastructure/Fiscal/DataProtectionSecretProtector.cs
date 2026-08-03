using Microsoft.AspNetCore.DataProtection;
using VeloXML.Application.Common.Interfaces;

namespace VeloXML.Infrastructure.Fiscal;

public sealed class DataProtectionSecretProtector : ISecretProtector
{
    private readonly IDataProtector _protector;

    public DataProtectionSecretProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("FocusNfe.CertificadoSenha");
    }

    public string Protect(string plainText) => _protector.Protect(plainText);
    public string Unprotect(string protectedText) => _protector.Unprotect(protectedText);
}
