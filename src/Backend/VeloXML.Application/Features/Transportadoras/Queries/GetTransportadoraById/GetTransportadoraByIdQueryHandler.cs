using MediatR;
using VeloXML.Application.Features.Transportadoras.Commands.CreateTransportadora;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Transportadoras.Queries.GetTransportadoraById;

public sealed class GetTransportadoraByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetTransportadoraByIdQuery, Result<TransportadoraDto>>
{
    public async Task<Result<TransportadoraDto>> Handle(GetTransportadoraByIdQuery request, CancellationToken ct)
    {
        var transportadora = await uow.Transportadoras.GetByIdAsync(request.Id, ct);
        if (transportadora is null || transportadora.ClienteId != request.ClienteId)
            throw new NotFoundException("Transportadora", request.Id);

        return Result.Success(CreateTransportadoraCommandHandler.ToDto(transportadora));
    }
}
