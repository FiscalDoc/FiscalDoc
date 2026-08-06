using VeloXML.SharedKernel;

namespace VeloXML.Domain.Entities;

public class PedidoItem : BaseEntity
{
    public Guid PedidoId { get; set; }
    public Guid ProdutoId { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public string Unidade { get; set; } = "UN";
    public decimal Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal Desconto { get; set; }
    public decimal ValorTotal { get; set; }
    public string? Cfop { get; set; }
    public string? Ncm { get; set; }
    public decimal AliquotaIcms { get; set; }
    public decimal AliquotaPis { get; set; }
    public decimal AliquotaCofins { get; set; }
    public string? CstIcms { get; set; }
    public string? CstPis { get; set; }
    public string? CstCofins { get; set; }
    public int IcmsOrigem { get; set; } = 0;
    public string? IbsCbsCst { get; set; }
    public string? IbsCbsClassificacaoTributaria { get; set; }

    public Pedido? Pedido { get; set; }
    public Produto? Produto { get; set; }
}
