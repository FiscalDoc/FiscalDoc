using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraVizinhos;

public sealed class GetTransportadoraVizinhosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetTransportadoraVizinhosQuery, Result<TransportadoraVizinhosDto>>
{
    public async Task<Result<TransportadoraVizinhosDto>> Handle(GetTransportadoraVizinhosQuery request, CancellationToken ct)
    {
        var transportadora = await uow.Transportadoras.GetByIdAsync(request.Id, ct);
        if (transportadora is null || transportadora.ClienteId != request.ClienteId)
            return Result.Failure<TransportadoraVizinhosDto>(ResultError.NotFound("Transportadora"));

        var (anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total) =
            await uow.Transportadoras.GetVizinhosAsync(request.ClienteId, request.Id, ct);

        return Result.Success(new TransportadoraVizinhosDto(anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total));
    }
}
