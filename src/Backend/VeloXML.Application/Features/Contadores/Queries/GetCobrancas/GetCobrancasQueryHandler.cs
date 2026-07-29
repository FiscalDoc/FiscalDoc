using MediatR;
using VeloXML.Application.Features.Contadores.Queries.GetContadores;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Contadores.Queries.GetCobrancas;

public sealed class GetCobrancasQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetCobrancasQuery, Result<PagedResult<CobrancaDto>>>
{
    public async Task<Result<PagedResult<CobrancaDto>>> Handle(GetCobrancasQuery request, CancellationToken ct)
    {
        var paged = await uow.Cobrancas.SearchAsync(
            request.Termo, request.Tipo, request.Status, request.Mes, request.Ano,
            request.Page, request.PageSize, ct);

        var dto = PagedResult<CobrancaDto>.Create(
            paged.Items.Select(CobrancaDtoMapper.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
