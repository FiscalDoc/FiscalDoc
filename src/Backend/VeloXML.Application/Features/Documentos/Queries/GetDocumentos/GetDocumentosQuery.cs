using MediatR;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentos;

public record GetDocumentosQuery(
    string? Termo,
    Guid? ClienteId,
    TipoDocumentoEnum? Tipo,
    StatusDocumentoEnum? Status,
    DateTime? De,
    DateTime? Ate,
    int Page = 1,
    int PageSize = 20
) : IRequest<Result<PagedResult<DocumentoDto>>>;
