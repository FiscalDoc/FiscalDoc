using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetPedidosResumo;

// KPIs do topo da tela de Pedidos/NF-e (faturamento, notas autorizadas, % de rejeição do mês
// corrente, cada um com variação vs o mês anterior) — mesmo espírito do GetClienteDashboardQuery,
// mas focado só no que essa tela mostra, pra não puxar dado que não vai ser usado ali.
public sealed class GetPedidosResumoQueryHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetPedidosResumoQuery, Result<PedidosResumoDto>>
{
    public async Task<Result<PedidosResumoDto>> Handle(GetPedidosResumoQuery request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<PedidosResumoDto>(ResultError.Unauthorized("Você não tem acesso aos pedidos deste cliente."));

        var hoje = DateTime.UtcNow;
        var mesAnterior = hoje.AddMonths(-1);

        var documentos = await uow.Documentos.GetByClienteAsync(request.ClienteId, ct);
        var faturamentoMes = FaturamentoDoMes(documentos, hoje.Year, hoje.Month);
        var faturamentoMesAnterior = FaturamentoDoMes(documentos, mesAnterior.Year, mesAnterior.Month);
        var canceladasMes = CanceladasDoMes(documentos, hoje.Year, hoje.Month);
        var canceladasMesAnterior = CanceladasDoMes(documentos, mesAnterior.Year, mesAnterior.Month);

        var emissoesMes = await uow.NfeEmissoes.GetByClienteEPeriodoAsync(request.ClienteId, hoje.Month, hoje.Year, ct);
        var emissoesMesAnterior = await uow.NfeEmissoes.GetByClienteEPeriodoAsync(request.ClienteId, mesAnterior.Month, mesAnterior.Year, ct);

        var (autorizadasMes, rejeicaoMes) = ResumoEmissoes(emissoesMes);
        var (autorizadasMesAnterior, rejeicaoMesAnterior) = ResumoEmissoes(emissoesMesAnterior);

        return Result.Success(new PedidosResumoDto(
            faturamentoMes,
            VariacaoPercentual(faturamentoMes, faturamentoMesAnterior),
            autorizadasMes,
            VariacaoPercentual(autorizadasMes, autorizadasMesAnterior),
            canceladasMes,
            VariacaoPercentual(canceladasMes, canceladasMesAnterior),
            rejeicaoMes,
            emissoesMesAnterior.Count > 0 ? Math.Round(rejeicaoMes - rejeicaoMesAnterior, 1) : null));
    }

    private static decimal FaturamentoDoMes(IReadOnlyList<Documento> documentos, int ano, int mes) =>
        documentos
            .Where(d => d.Tipo == TipoDocumentoEnum.NFe && d.Status != StatusDocumentoEnum.Cancelado
                && d.DataEmissao.Year == ano && d.DataEmissao.Month == mes)
            .Sum(d => d.ValorTotal);

    // Conta pela data do cancelamento, não da emissão original — "canceladas em agosto" deve
    // contar quem foi cancelada em agosto, mesmo que tenha sido emitida num mês anterior.
    private static int CanceladasDoMes(IReadOnlyList<Documento> documentos, int ano, int mes) =>
        documentos.Count(d => d.Tipo == TipoDocumentoEnum.NFe && d.Status == StatusDocumentoEnum.Cancelado
            && d.DataCancelamento.HasValue && d.DataCancelamento.Value.Year == ano && d.DataCancelamento.Value.Month == mes);

    // "Concluídas" = tentativas de emissão que já chegaram num estado final (Autorizada,
    // Rejeitada, Erro ou Cancelada) — Enviada/Processando ainda estão em andamento e não contam
    // nem pro numerador nem pro denominador da taxa de rejeição.
    private static (int autorizadas, decimal percentualRejeicao) ResumoEmissoes(IReadOnlyList<NfeEmissao> emissoes)
    {
        var autorizadas = emissoes.Count(e => e.Status == NfeEmissaoStatusEnum.Autorizada);
        var rejeitadas = emissoes.Count(e => e.Status == NfeEmissaoStatusEnum.Rejeitada);
        var concluidas = emissoes.Count(e => e.Status is NfeEmissaoStatusEnum.Autorizada or NfeEmissaoStatusEnum.Rejeitada
            or NfeEmissaoStatusEnum.Erro or NfeEmissaoStatusEnum.Cancelada);

        var percentual = concluidas > 0 ? Math.Round((decimal)rejeitadas / concluidas * 100, 1) : 0m;
        return (autorizadas, percentual);
    }

    private static decimal? VariacaoPercentual(decimal atual, decimal anterior) =>
        anterior == 0 ? null : Math.Round((atual - anterior) / anterior * 100, 1);

    private static decimal? VariacaoPercentual(int atual, int anterior) => VariacaoPercentual((decimal)atual, anterior);
}
