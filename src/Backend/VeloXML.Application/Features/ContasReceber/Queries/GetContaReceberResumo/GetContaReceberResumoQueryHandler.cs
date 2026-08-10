using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Queries.GetContaReceberResumo;

public sealed class GetContaReceberResumoQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetContaReceberResumoQuery, Result<ContaReceberResumoDto>>
{
    public async Task<Result<ContaReceberResumoDto>> Handle(GetContaReceberResumoQuery request, CancellationToken ct)
    {
        var r = await uow.ContasReceber.GetResumoAsync(request.ClienteId, ct);
        return Result.Success(new ContaReceberResumoDto(r.TotalPendente, r.TotalAtrasado, r.TotalPagoNoMes, r.QtdPendente, r.QtdAtrasado));
    }
}
