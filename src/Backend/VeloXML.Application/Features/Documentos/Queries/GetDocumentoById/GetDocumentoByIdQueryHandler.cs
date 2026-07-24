using AutoMapper;
using MediatR;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentoById;

public sealed class GetDocumentoByIdQueryHandler(IUnitOfWork uow, IMapper mapper)
    : IRequestHandler<GetDocumentoByIdQuery, Result<DocumentoDto>>
{
    public async Task<Result<DocumentoDto>> Handle(GetDocumentoByIdQuery request, CancellationToken ct)
    {
        var documento = await uow.Documentos.GetByIdAsync(request.Id, ct);
        return documento is null
            ? Result.Failure<DocumentoDto>(ResultError.NotFound("Documento"))
            : Result.Success(mapper.Map<DocumentoDto>(documento));
    }
}
