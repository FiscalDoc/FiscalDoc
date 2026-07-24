using MediatR;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentoById;

public record GetDocumentoByIdQuery(Guid Id) : IRequest<Result<DocumentoDto>>;
