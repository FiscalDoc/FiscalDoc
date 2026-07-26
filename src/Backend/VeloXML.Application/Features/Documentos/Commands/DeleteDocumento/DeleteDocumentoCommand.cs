using MediatR;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.DeleteDocumento;

public record DeleteDocumentoCommand(Guid Id) : IRequest<Result>;
