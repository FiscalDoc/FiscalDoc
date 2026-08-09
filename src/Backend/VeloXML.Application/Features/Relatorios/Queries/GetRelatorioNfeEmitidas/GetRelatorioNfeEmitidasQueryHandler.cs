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

        // Custo só existe quando dá pra saber quais Produtos foram vendidos (nota emitida a
        // partir de um Pedido daqui) — nota importada de XML externo não tem Pedido nenhum, e o
        // XML da NF-e em si não carrega custo interno de forma alguma.
        var pedidos = documentoIds.Count == 0
            ? []
            : await uow.Pedidos.GetPorDocumentoIdsComItensAsync(documentoIds, ct);
        var lucroPorDocumentoId = pedidos
            .Where(p => p.DocumentoId.HasValue)
            .ToDictionary(p => p.DocumentoId!.Value, p => p.Itens.Sum(i =>
                i.ValorTotal - i.Quantidade * ((i.Produto?.ValorCusto ?? 0) + i.PrecoUnitario * (i.Produto?.PercentualImposto ?? 0) / 100)));

        var itens = emissoes.Select(e =>
        {
            Documento? doc = e.DocumentoId.HasValue && documentos.TryGetValue(e.DocumentoId.Value, out var d) ? d : null;
            decimal? lucro = e.DocumentoId.HasValue && lucroPorDocumentoId.TryGetValue(e.DocumentoId.Value, out var l) ? l : null;
            return new RelatorioNfeItemDto(
                e.SolicitadoPorNome,
                e.CreatedAt,
                e.Numero,
                e.Serie,
                e.Status.ToString(),
                e.ChaveAcesso,
                doc?.ValorTotal,
                lucro);
        }).ToList();

        return Result.Success(new RelatorioNfeEmitidasDto(
            itens.Count,
            itens.Count(i => i.Status == "Autorizada"),
            itens.Count(i => i.Status == "Cancelada"),
            itens.Sum(i => i.ValorTotal ?? 0),
            itens.Sum(i => i.Lucro ?? 0),
            itens.Count(i => i.Lucro.HasValue),
            itens));
    }
}
