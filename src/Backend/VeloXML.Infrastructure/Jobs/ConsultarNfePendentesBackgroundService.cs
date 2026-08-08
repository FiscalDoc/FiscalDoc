using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace VeloXML.Infrastructure.Jobs;

// ConsultarNfePendentesJob roda a cada 5s — mais rápido do que o cron do Hangfire consegue
// expressar (a menor granularidade é 1 minuto), por isso é um BackgroundService próprio em
// vez de RecurringJob. Cria um novo escopo de DI a cada tick pra resolver ConsultarNfePendentesJob
// (scoped, depende de IUnitOfWork) — o serviço em si é singleton, como todo IHostedService.
public sealed class ConsultarNfePendentesBackgroundService(
    IServiceScopeFactory scopeFactory, ILogger<ConsultarNfePendentesBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan Intervalo = TimeSpan.FromSeconds(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Intervalo);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var job = scope.ServiceProvider.GetRequiredService<ConsultarNfePendentesJob>();
                await job.ExecuteAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Encerramento normal do serviço — não é erro.
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Falha ao executar ConsultarNfePendentesJob no ciclo de 15s");
            }
        }
    }
}
