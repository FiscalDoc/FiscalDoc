namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidosResumo;

public record PedidosResumoDto(
    decimal FaturamentoMes,
    decimal? FaturamentoVariacaoPercentual,
    int NotasAutorizadasMes,
    decimal? NotasAutorizadasVariacaoPercentual,
    decimal PercentualRejeicaoMes,
    // Diferença em pontos percentuais vs mês anterior (não variação relativa) — mais direto de
    // ler numa taxa pequena como essa (ex.: "-1,2 p.p." em vez de "-40%").
    decimal? PercentualRejeicaoVariacaoPontos
);
