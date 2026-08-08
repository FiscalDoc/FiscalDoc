using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Auth.Common;

// Resolve os dados de "empresa" embutidos no JWT (claims "empresa"/"cnpj") a partir de quem o
// usuário representa — usado em todo lugar que gera um token (Login, Verify2fa, RefreshToken)
// pra não duplicar essa lógica nem deixar algum fluxo esquecer de popular a claim (já
// aconteceu: o login de um usuário Cliente nunca preenchia "empresa", só o de Contador).
internal static class EmpresaClaimHelper
{
    public static async Task<(string? Empresa, string? Cnpj)> ResolverAsync(IUnitOfWork uow, User user, CancellationToken ct)
    {
        if (user.ContadorId.HasValue)
        {
            var contador = await uow.Contadores.GetByIdAsync(user.ContadorId.Value, ct);
            return (contador?.Empresa ?? contador?.Nome, null);
        }

        if (user.ClienteId.HasValue)
        {
            var cliente = await uow.Clientes.GetByIdAsync(user.ClienteId.Value, ct);
            return (cliente?.NomeFantasia ?? cliente?.RazaoSocial, cliente?.Cnpj);
        }

        return (null, null);
    }
}
