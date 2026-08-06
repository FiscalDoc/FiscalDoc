using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public record CreatePedidoItemInput(
    Guid ProdutoId,
    string Descricao,
    string Unidade,
    decimal Quantidade,
    decimal PrecoUnitario,
    decimal Desconto,
    string? Cfop,
    string? Ncm,
    decimal AliquotaIcms,
    decimal AliquotaPis,
    decimal AliquotaCofins,
    string? CstIcms = null,
    string? CstPis = null,
    string? CstCofins = null,
    int IcmsOrigem = 0,
    string? IbsCbsCst = null,
    string? IbsCbsClassificacaoTributaria = null
);

public record CreatePedidoCommand(
    Guid ClienteId,
    Guid DestinatarioId,
    string? Observacoes,
    List<CreatePedidoItemInput> Itens,
    string NaturezaOperacao,
    DateTime? DataSaida,
    string? FormaPagamento,
    string? MeioPagamento,
    string? InformacoesComplementares,
    string FinalidadeEmissao = "Normal",
    string ModalidadeFrete = "SemFrete",
    bool ConsumidorFinal = true,
    int PresencaComprador = 9,
    decimal ValorFrete = 0,
    decimal ValorSeguro = 0,
    decimal ValorOutrasDespesas = 0
) : IRequest<Result<PedidoDto>>;
