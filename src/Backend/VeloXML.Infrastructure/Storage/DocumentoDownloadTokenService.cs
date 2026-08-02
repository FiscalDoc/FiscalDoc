using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using VeloXML.Infrastructure.Auth;

namespace VeloXML.Infrastructure.Storage;

// Gera/valida um token de download curto e assinado (HMAC), embutindo o id do documento e a
// expiração — permite um link de download real (sem Authorization header) sem precisar expor
// a URL interna do MinIO/S3 (que no MinIO auto-hospedado nem é alcançável pelo navegador,
// já que "Storage:Endpoint" é o hostname interno da rede docker). O navegador navega direto
// pra esse link (não é blob: URL construída via JS), então o Chrome não marca como "pode
// danificar seu dispositivo" — esse aviso é específico de downloads via blob: URL.
public sealed class DocumentoDownloadTokenService(IOptions<JwtOptions> jwtOpts)
{
    public string Gerar(Guid documentoId, TimeSpan validade)
    {
        var expira = DateTimeOffset.UtcNow.Add(validade).ToUnixTimeSeconds();
        var payload = $"{documentoId:N}.{expira}";
        return $"{payload}.{Assinar(payload)}";
    }

    public Guid? Validar(string token)
    {
        var partes = token.Split('.');
        if (partes.Length != 3) return null;

        var payload = $"{partes[0]}.{partes[1]}";
        if (!CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(Assinar(payload)), Encoding.UTF8.GetBytes(partes[2])))
            return null;

        if (!long.TryParse(partes[1], out var expira) || DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expira)
            return null;

        return Guid.TryParse(partes[0], out var id) ? id : null;
    }

    private string Assinar(string payload)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(jwtOpts.Value.Secret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        return Convert.ToBase64String(hash).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
