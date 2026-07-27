using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarioById;

public sealed class GetDestinatarioByIdQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetDestinatarioByIdQuery, Result<DestinatarioDto>>
{
    public async Task<Result<DestinatarioDto>> Handle(GetDestinatarioByIdQuery request, CancellationToken ct)
    {
        var dest = await uow.Destinatarios.GetByIdAsync(request.Id, ct);
        if (dest is null || dest.ClienteId != request.ClienteId)
            throw new NotFoundException("Destinatario", request.Id);

        return Result.Success(CreateDestinatarioCommandHandler.ToDto(dest));
    }
}
