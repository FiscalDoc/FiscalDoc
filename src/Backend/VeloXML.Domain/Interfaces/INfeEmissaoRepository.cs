using VeloXML.Domain.Entities;

namespace VeloXML.Domain.Interfaces;

public interface INfeEmissaoRepository : IRepository<NfeEmissao>
{
    Task<NfeEmissao?> GetByRefAsync(string refId, CancellationToken ct = default);
    Task<NfeEmissao?> GetLatestByPedidoAsync(Guid pedidoId, CancellationToken ct = default);
    Task<IReadOnlyList<NfeEmissao>> GetPendentesAsync(DateTime criadasAntesDe, CancellationToken ct = default);

    // Pra relatório mensal de notas emitidas — Autorizada/Cancelada são as duas únicas que
    // representam uma NF-e que de fato saiu (Enviada/Processando/Rejeitada/Erro nunca viraram
    // nota de verdade). Sem filtro de Tenant/Cliente aqui de propósito (mesmo motivo de
    // NfeEmissao não ter FK pra Tenant) — quem chama já valida o acesso ao Cliente antes.
    Task<IReadOnlyList<NfeEmissao>> GetEmitidasNoPeriodoAsync(int mes, int ano, Guid? clienteId, CancellationToken ct = default);

    // Diferente de GetEmitidasNoPeriodoAsync: traz TODAS as tentativas de emissão do período
    // (inclusive Rejeitada/Erro/Processando) — necessário pro cálculo de taxa de rejeição do
    // resumo de KPIs da tela de Pedidos, que precisa do denominador completo, não só do que saiu.
    Task<IReadOnlyList<NfeEmissao>> GetByClienteEPeriodoAsync(Guid clienteId, int mes, int ano, CancellationToken ct = default);
}
