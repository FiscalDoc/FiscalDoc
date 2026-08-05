using MediatR;
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
        // "Emitido" sozinho é só o flip interno antigo (sem NF-e real) — pra bater com a
        // mesma distinção já feita na lista de Pedidos, conta como Nota Fiscal só quem
        // realmente tem um Documento vinculado (emitido via Focus ou NF-e importada/vinculada).
        var pedidosEmitidos = pedidos.Count(p => p.DocumentoId.HasValue);
        var pedidosCancelados = pedidos.Count(p => p.Status == "Cancelado");
        var valorPedidosMes = pedidos.Where(p => p.CreatedAt >= inicioMes).Sum(p => p.ValorTotal);

        return Result.Success(new ClienteDashboardDto(
            totalDocumentos, totalNotasFiscais, totalPedidos,
            pedidosRascunho, pedidosEmitidos, pedidosCancelados,
            valorPedidosMes, valorDocumentosMes, alertasAtivos,
            porTipo, porMes));
    }
}
