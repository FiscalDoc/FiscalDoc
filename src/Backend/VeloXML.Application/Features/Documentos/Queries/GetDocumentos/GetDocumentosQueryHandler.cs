using AutoMapper;
using MediatR;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentos;

public sealed class GetDocumentosQueryHandler(IUnitOfWork uow, IMapper mapper, ICurrentUser currentUser)
    : IRequestHandler<GetDocumentosQuery, Result<PagedResult<DocumentoDto>>>
{
    public async Task<Result<PagedResult<DocumentoDto>>> Handle(GetDocumentosQuery request, CancellationToken ct)
    {
        // Clientes só veem os próprios documentos, ignorando o filtro da rota
        var clienteId = currentUser.Role == "Cliente" ? currentUser.ClienteId : request.ClienteId;

        var paged = await uow.Documentos.SearchAsync(
            request.Termo, clienteId, request.Tipo, request.Status, request.Origem,
            request.De, request.Ate, request.Page, request.PageSize, ct);

        var items = paged.Items.Select(mapper.Map<DocumentoDto>).ToList();
        return Result.Success(PagedResult<DocumentoDto>.Create(items, paged.TotalCount, paged.Page, paged.PageSize));
    }
}
