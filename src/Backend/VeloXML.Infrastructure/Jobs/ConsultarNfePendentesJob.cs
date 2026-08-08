using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Interfaces;

namespace VeloXML.Infrastructure.Jobs;

// Rede de segurança pra quando o webhook da Focus não consegue alcançar o servidor (ex.:
// ambiente local sem túnel público) — varre emissões ainda "Processando" e reconsulta o
// status direto na Focus. Não compete com o webhook: uma emissão já finalizada por ele nunca
// aparece aqui de novo, já que GetPendentesAsync só traz Status == Processando.
public sealed class ConsultarNfePendentesJob(
    IUnitOfWork uow, IFocusNfeService focusNfe, NfeEmissaoFinalizer finalizer, ILogger<ConsultarNfePendentesJob> logger)
{
    public const string JobId = "consultar-nfe-focus-pendentes";

    public async Task ExecuteAsync(CancellationToken ct = default)
    {
        var limite = DateTime.UtcNow.AddSeconds(-3);
        var pendentes = await uow.NfeEmissoes.GetPendentesAsync(limite, ct);
        if (pendentes.Count == 0) return;

        var clienteIds = pendentes.Select(e => e.ClienteId).Distinct().ToList();
        var clientes = (await uow.Clientes.FindAsync(c => clienteIds.Contains(c.Id), ct)).ToDictionary(c => c.Id);

        var finalizados = 0;
        foreach (var emissao in pendentes)
        {
            if (!clientes.TryGetValue(emissao.ClienteId, out var cliente)) continue;

            try
            {
                var resultado = await focusNfe.ConsultarNfeAsync(cliente, emissao.Ref, ct);
                if (!resultado.Concluida) continue;

                await finalizer.FinalizarAsync(emissao, cliente, resultado, ct);
                finalizados++;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Falha ao consultar status da NfeEmissao {Id} (ref {Ref}) na Focus NFe", emissao.Id, emissao.Ref);
            }
        }

        logger.LogInformation(
            "[ConsultarNfePendentes] {Total} pendente(s) verificada(s), {Finalizados} finalizada(s)",
            pendentes.Count, finalizados);
    }
}
