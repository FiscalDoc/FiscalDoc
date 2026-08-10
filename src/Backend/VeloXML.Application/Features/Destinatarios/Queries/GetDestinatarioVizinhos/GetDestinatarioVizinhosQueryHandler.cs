using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioVizinhos;

public sealed class GetDestinatarioVizinhosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetDestinatarioVizinhosQuery, Result<DestinatarioVizinhosDto>>
{
    public async Task<Result<DestinatarioVizinhosDto>> Handle(GetDestinatarioVizinhosQuery request, CancellationToken ct)
    {
        var destinatario = await uow.Destinatarios.GetByIdAsync(request.Id, ct);
        if (destinatario is null || destinatario.ClienteId != request.ClienteId)
            return Result.Failure<DestinatarioVizinhosDto>(ResultError.NotFound("Destinatário"));

        var (anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total) =
            await uow.Destinatarios.GetVizinhosAsync(request.ClienteId, request.Id, ct);

        return Result.Success(new DestinatarioVizinhosDto(anteriorId, anteriorLabel, proximoId, proximoLabel, posicao, total));
    }
}
