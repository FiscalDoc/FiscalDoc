using MediatR;
using VeloXML.Application.Common;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Dashboard.Queries.GetClienteDashboard;

public sealed class GetClienteDashboardQueryHandler(IUnitOfWork uow, ICurrentUser currentUser)
    : IRequestHandler<GetClienteDashboardQuery, Result<ClienteDashboardDto>>
{
    private static readonly string[] MesNomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    public async Task<Result<ClienteDashboardDto>> Handle(GetClienteDashboardQuery request, CancellationToken ct)
    {
        if (currentUser.Role == nameof(PerfilEnum.Cliente) && currentUser.ClienteId != request.ClienteId)
            return Result.Failure<ClienteDashboardDto>(ResultError.Unauthorized("Você não tem acesso ao dashboard deste cliente."));

        var documentos = await uow.Documentos.GetByClienteAsync(request.ClienteId, ct);
        var pedidosPaged = await uow.Pedidos.SearchAsync(request.ClienteId, null, null, null, null, 1, 5000, ct);
        var pedidos = pedidosPaged.Items;
        var alertasAtivos = await uow.Alertas.CountAtivosAsync(request.ClienteId, ct);

        var hoje = DateTime.UtcNow;
        var inicioMes = new DateTime(hoje.Year, hoje.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var totalDocumentos = documentos.Count;
        var totalNotasFiscais = documentos.Count(d => d.Tipo == TipoDocumentoEnum.NFe);
        var valorDocumentosMes = documentos.Where(d => d.DataEmissao >= inicioMes).Sum(d => d.ValorTotal);
        // Faturamento total (histórico completo, não só o mês) das NF-e realmente autorizadas —
        // exclui canceladas e duplicadas, senão o valor faturado incluiria notas que não valem
        // mais nada ou a mesma nota contada duas vezes.
        var faturamentoTotalNotas = documentos
            .Where(d => d.Tipo == TipoDocumentoEnum.NFe && DocumentoFaturamentoHelper.ContaComoFaturamento(d.Status))
            .Sum(d => d.ValorTotal);

        var porTipo = documentos
            .GroupBy(d => d.Tipo.ToString())
            .Select(g => new DocumentoPorTipoClienteDto(
                g.Key, g.Count(),
                documentos.Count > 0 ? Math.Round((decimal)g.Count() / documentos.Count * 100, 1) : 0))
            .OrderByDescending(x => x.Quantidade)
            .ToList();

        var doze = hoje.AddMonths(-11);
        var inicioDoze = new DateTime(doze.Year, doze.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var mesMap = documentos
            .Where(d => d.DataEmissao >= inicioDoze)
            .GroupBy(d => new { d.DataEmissao.Year, d.DataEmissao.Month })
            .ToDictionary(g => g.Key, g => g.Count());

        var porMes = Enumerable.Range(0, 12)
            .Select(i => inicioDoze.AddMonths(i))
            .Select(m =>
            {
                var key = new { m.Year, m.Month };
                mesMap.TryGetValue(key, out var qtd);
                return new DocumentoPorMesClienteDto(m.Year, m.Month, MesNomes[m.Month - 1], qtd);
            })
            .ToList();

        var totalPedidos = pedidos.Count;
        var pedidosRascunho = pedidos.Count(p => p.Status == "Rascunho");
        // Card do dashboard é só sobre Nota Fiscal agora (não mistura mais com Pedido/Rascunho)
        // — "Emitido" conta quem tem Documento vinculado de verdade (via Focus ou NF-e
        // importada/vinculada), "Cancelado" conta o Documento cancelado, não o Pedido cancelado
        // (são conceitos diferentes: um Pedido pode ser cancelado sem nunca ter tido NF-e).
        var pedidosEmitidos = pedidos.Count(p => p.DocumentoId.HasValue);
        var pedidosCancelados = documentos.Count(d => d.Status == StatusDocumentoEnum.Cancelado);
        var valorPedidosMes = pedidos.Where(p => p.CreatedAt >= inicioMes).Sum(p => p.ValorTotal);

        return Result.Success(new ClienteDashboardDto(
            totalDocumentos, totalNotasFiscais, totalPedidos,
            pedidosRascunho, pedidosEmitidos, pedidosCancelados,
            valorPedidosMes, valorDocumentosMes, faturamentoTotalNotas, alertasAtivos,
            porTipo, porMes));
    }
}
