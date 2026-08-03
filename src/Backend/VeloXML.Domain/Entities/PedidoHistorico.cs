using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class PedidoHistorico : BaseEntity
{
    public Guid PedidoId { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public string? UsuarioNome { get; set; }

    public Pedido? Pedido { get; set; }
}
