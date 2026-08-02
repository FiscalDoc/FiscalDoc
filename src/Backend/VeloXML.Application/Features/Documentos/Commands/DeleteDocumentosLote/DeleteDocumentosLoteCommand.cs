using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.DeleteDocumentosLote;

public record DeleteDocumentosLoteCommand(List<Guid> Ids) : IRequest<Result<int>>;
