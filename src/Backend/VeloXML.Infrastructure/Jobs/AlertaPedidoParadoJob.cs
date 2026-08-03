using Microsoft.Extensions.Logging;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

public sealed class AlertaPedidoParadoJob(IUnitOfWork uow, ILogger<AlertaPedidoParadoJob> logger)
{
    public const string JobId = "alerta-pedido-parado";
    private const int DiasParaAlertar = 3;

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var limite = DateTime.UtcNow.AddDays(-DiasParaAlertar);

        var pedidosParados = await uow.Pedidos.FindAsync(p => p.Status == "Rascunho" && p.CreatedAt <= limite, ct);

        var alertasAtivos = await uow.Alertas.FindAsync(
            a => a.Tipo == "PedidoParado" && a.Status == StatusAlertaEnum.Ativo && a.PedidoId != null, ct);
        var pedidoIdsJaAlertados = alertasAtivos.Select(a => a.PedidoId!.Value).ToHashSet();

        var criados = 0;
        foreach (var pedido in pedidosParados)
        {
            if (pedidoIdsJaAlertados.Contains(pedido.Id)) continue;

            var dias = (int)(DateTime.UtcNow - pedido.CreatedAt).TotalDays;
            await uow.Alertas.AddAsync(new Alerta
            {
                TenantId = pedido.TenantId,
                ClienteId = pedido.ClienteId,
                PedidoId = pedido.Id,
                Titulo = $"Pedido nº {pedido.Numero} parado em rascunho",
                Descricao = $"O pedido nº {pedido.Numero} está em rascunho há {dias} dias e ainda não foi emitido.",
                Tipo = "PedidoParado",
                Severidade = "warning",
                Status = StatusAlertaEnum.Ativo,
            }, ct);
            criados++;
        }

        // Resolve alertas cujo pedido já deixou de estar em rascunho (emitido, cancelado ou
        // excluído) — senão o alerta continua "ativo" pra sempre mesmo depois de resolvido.
        var pedidoIdsAindaRascunho = (await uow.Pedidos.FindAsync(
            p => pedidoIdsJaAlertados.Contains(p.Id) && p.Status == "Rascunho", ct))
            .Select(p => p.Id).ToHashSet();

        var resolvidos = 0;
        foreach (var alerta in alertasAtivos)
        {
            if (alerta.PedidoId != null && !pedidoIdsAindaRascunho.Contains(alerta.PedidoId.Value))
            {
                alerta.Status = StatusAlertaEnum.Resolvido;
                uow.Alertas.Update(alerta);
                resolvidos++;
            }
        }

        await uow.SaveChangesAsync(ct);

        logger.LogInformation(
            "[AlertaPedidoParado] Execução concluída | Pedidos parados encontrados: {Total} | Alertas criados: {Criados} | Alertas resolvidos: {Resolvidos}",
            pedidosParados.Count, criados, resolvidos);
    }
}
