namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public record PedidoItemDto(
    Guid Id,
    Guid ProdutoId,
    string Descricao,
    string Unidade,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Desconto,
    decimal ValorTotal,
    string? Cfop,
    string? Ncm,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins
);

public record PedidoDto(
    Guid Id,
    int Numero,
    Guid ClienteId,
    Guid DestinatarioId,
    string DestinatarioNome,
    string Status,
    string? Observacoes,
    decimal ValorTotal,
    DateTime CreatedAt,
    List<PedidoItemDto> Itens,
    string NaturezaOperacao,
    DateTime? DataSaida,
    string? FormaPagamento,
    string? MeioPagamento,
    string? InformacoesComplementares,
    Guid? DocumentoId,
    string? DocumentoNumero,
    string? DocumentoChaveAcesso
);
