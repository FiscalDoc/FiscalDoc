using AutoMapper;
using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Alertas.Queries.GetAlertas;

public sealed class GetAlertasQueryHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<GetAlertasQuery, Result<PagedResult<AlertaDto>>>
{
    public async Task<Result<PagedResult<AlertaDto>>> Handle(GetAlertasQuery request, CancellationToken ct)
    {
        var paged = await uow.Alertas.GetByClienteAsync(request.ClienteId ?? Guid.Empty, request.Status, request.Page, request.PageSize, ct);
        var items = paged.Items.Select(mapper.Map<AlertaDto>).ToList();
        return Result.Success(PagedResult<AlertaDto>.Create(items, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
