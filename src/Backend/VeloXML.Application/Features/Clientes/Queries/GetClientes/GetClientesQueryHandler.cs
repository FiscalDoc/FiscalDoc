using AutoMapper;
using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Clientes.Queries.GetClientes;

public sealed class GetClientesQueryHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<GetClientesQuery, Result<PagedResult<ClienteDto>>>
{
    public async Task<Result<PagedResult<ClienteDto>>> Handle(GetClientesQuery request, CancellationToken ct)
    {
        var paged = await uow.Clientes.SearchAsync(request.Termo, request.ContadorId, request.Page, request.PageSize, ct);
        var items = paged.Items.Select(mapper.Map<ClienteDto>).ToList();
        return Result.Success(PagedResult<ClienteDto>.Create(items, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
