using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContasReceber;

public sealed class GetContasReceberQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetContasReceberQuery, Result<PagedResult<ContaReceberDto>>>
{
    public async Task<Result<PagedResult<ContaReceberDto>>> Handle(GetContasReceberQuery request, CancellationToken ct)
    {
        var result = await uow.ContasReceber.SearchAsync(request.ClienteId, request.Status, request.De, request.Ate, request.Page, request.PageSize, ct);

        var dtos = result.Items
            .Select(c => CreateContaReceberCommandHandler.ToDto(c, c.Destinatario?.RazaoSocial ?? "", c.Pedido?.Numero))
            .ToList();

        return Result.Success(PagedResult<ContaReceberDto>.Create(dtos, result.TotalCount, result.Page, result.PageSize));
    }
}
