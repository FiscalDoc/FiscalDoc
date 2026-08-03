using VeloXML.Domain.Entities;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Common;

internal static class PedidoHistoricoHelper
{
    public static PedidoHistorico Criar(Guid pedidoId, Guid tenantId, string tipo, string descricao, ICurrentUser currentUser) => new()
    {
        TenantId = tenantId,
        PedidoId = pedidoId,
        Tipo = tipo,
        Descricao = descricao,
        UsuarioNome = currentUser.Name ?? currentUser.Email,
    };
}
