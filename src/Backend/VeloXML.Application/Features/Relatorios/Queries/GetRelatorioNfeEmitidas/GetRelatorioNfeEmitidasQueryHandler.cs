using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Relatorios.Queries.GetRelatorioNfeEmitidas;

public sealed class GetRelatorioNfeEmitidasQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetRelatorioNfeEmitidasQuery, Result<RelatorioNfeEmitidasDto>>
{
    public async Task<Result<RelatorioNfeEmitidasDto>> Handle(GetRelatorioNfeEmitidasQuery request, CancellationToken ct)
    {
        // GetByIdAsync passa pelo query filter global de Cliente (Contador só enxerga os
        // próprios clientes, Cliente só enxerga a si mesmo) — é isso que impede alguém de
        // consultar o relatório de um cliente que não é seu, sem precisar checagem manual aqui.
        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<RelatorioNfeEmitidasDto>(ResultError.NotFound("Cliente"));

        var emissoes = await uow.NfeEmissoes.GetEmitidasNoPeriodoAsync(request.Mes, request.Ano, request.ClienteId, ct);

        var documentoIds = emissoes.Where(e => e.DocumentoId.HasValue).Select(e => e.DocumentoId!.Value).Distinct().ToList();
        var documentos = documentoIds.Count == 0
            ? new Dictionary<Guid, Documento>()
            : (await uow.Documentos.FindAsync(d => documentoIds.Contains(d.Id), ct)).ToDictionary(d => d.Id);

        var itens = emissoes.Select(e =>
        {
            Documento? doc = e.DocumentoId.HasValue && documentos.TryGetValue(e.DocumentoId.Value, out var d) ? d : null;
            return new RelatorioNfeItemDto(
                e.SolicitadoPorNome,
                e.CreatedAt,
                e.Numero,
                e.Serie,
                e.Status.ToString(),
                e.ChaveAcesso,
                doc?.ValorTotal);
        }).ToList();

        return Result.Success(new RelatorioNfeEmitidasDto(
            itens.Count,
            itens.Count(i => i.Status == "Autorizada"),
            itens.Count(i => i.Status == "Cancelada"),
            itens.Sum(i => i.ValorTotal ?? 0),
            itens));
    }
}
