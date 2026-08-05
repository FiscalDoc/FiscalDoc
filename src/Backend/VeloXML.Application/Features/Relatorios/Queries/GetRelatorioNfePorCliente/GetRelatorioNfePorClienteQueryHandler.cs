using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfePorCliente;

public sealed class GetRelatorioNfePorClienteQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetRelatorioNfePorClienteQuery, Result<List<RelatorioNfePorClienteItemDto>>>
{
    public async Task<Result<List<RelatorioNfePorClienteItemDto>>> Handle(GetRelatorioNfePorClienteQuery request, CancellationToken ct)
    {
        var emissoes = await uow.NfeEmissoes.GetEmitidasNoPeriodoAsync(request.Mes, request.Ano, null, ct);
        if (emissoes.Count == 0)
            return Result.Success(new List<RelatorioNfePorClienteItemDto>());

        var documentoIds = emissoes.Where(e => e.DocumentoId.HasValue).Select(e => e.DocumentoId!.Value).Distinct().ToList();
        var documentos = documentoIds.Count == 0
            ? new Dictionary<Guid, Documento>()
            : (await uow.Documentos.FindAsync(d => documentoIds.Contains(d.Id), ct)).ToDictionary(d => d.Id);

        // Admin (TenantId/ContadorId/ClienteId nulos no query filter) enxerga todos os clientes
        // de todos os tenants — é exatamente o escopo "por cliente" que esse relatório precisa.
        var clienteIds = emissoes.Select(e => e.ClienteId).Distinct().ToList();
        var clientes = (await uow.Clientes.FindAsync(c => clienteIds.Contains(c.Id), ct)).ToDictionary(c => c.Id);

        var itens = emissoes
            .GroupBy(e => e.ClienteId)
            .Select(g =>
            {
                clientes.TryGetValue(g.Key, out var cliente);
                var valorTotal = g.Sum(e =>
                    e.DocumentoId.HasValue && documentos.TryGetValue(e.DocumentoId.Value, out var doc) ? doc.ValorTotal : 0);
                return new RelatorioNfePorClienteItemDto(
                    g.Key,
                    cliente?.RazaoSocial ?? "—",
                    g.Count(),
                    g.Count(e => e.Status.ToString() == "Autorizada"),
                    g.Count(e => e.Status.ToString() == "Cancelada"),
                    valorTotal);
            })
            .OrderByDescending(i => i.Quantidade)
            .ToList();

        return Result.Success(itens);
    }
}
