using MediatR;
using VeloXML.Application.Features.Destinatarios.Commands.CreateDestinatario;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Destinatarios.Queries.GetDestinatarios;

public sealed class GetDestinatariosQueryHandler(IUnitOfWork uow)
    : IRequestHandler<GetDestinatariosQuery, Result<PagedResult<DestinatarioDto>>>
{
    public async Task<Result<PagedResult<DestinatarioDto>>> Handle(GetDestinatariosQuery request, CancellationToken ct)
    {
        var paged = await uow.Destinatarios.SearchAsync(
            request.ClienteId, request.Termo, request.Page, request.PageSize, ct);

        var dto = PagedResult<DestinatarioDto>.Create(
            paged.Items.Select(CreateDestinatarioCommandHandler.ToDto).ToList(),
            paged.TotalCount, paged.Page, paged.PageSize);

        return Result.Success(dto);
    }
}
