using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoras;

public sealed class GetTransportadorasQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetTransportadorasQuery, Result<PagedResult<TransportadoraDto>>>
{
    public async Task<Result<PagedResult<TransportadoraDto>>> Handle(GetTransportadorasQuery request, CancellationToken ct)
    {
        var paged = await uow.Transportadoras.SearchAsync(
            request.ClienteId, request.Termo, request.Page, request.PageSize, ct);

        var dto = PagedResult<TransportadoraDto>.Create(
            paged.Items.Select(CreateTransportadoraCommandHandler.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
