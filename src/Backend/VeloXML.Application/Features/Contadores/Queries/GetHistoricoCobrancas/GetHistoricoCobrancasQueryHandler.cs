using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetHistoricoCobrancas;

public sealed class GetHistoricoCobrancasQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetHistoricoCobrancasQuery, Result<IReadOnlyList<CobrancaDto>>>
{
    public async Task<Result<IReadOnlyList<CobrancaDto>>> Handle(GetHistoricoCobrancasQuery request, CancellationToken ct)
    {
        var list = await uow.Cobrancas.GetByContadorAsync(request.ContadorId, ct);
        var result = list.Select(c => new CobrancaDto(
            c.Id, c.ContadorId, c.Mes, c.Ano,
            c.TotalClientes, c.ValorPorCliente, c.ValorBase,
            c.LimiteXmlTotal, c.XmlsProcessados, c.XmlsExcedentes,
            c.ValorExcedente, c.ValorTotal,
            c.Status.ToString(), c.DataVencimento, c.DataPagamento, c.Observacao))
            .ToList();
        return Result.Success<IReadOnlyList<CobrancaDto>>(result);
    }
}
