using MediatR;
using VeloXML.Application.Common.DTOs;
using VeloXML.Application.Features.Documentos.Queries.GetDocumentos;
using VeloXML.Domain.Enums;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Documentos.Commands.UploadDocumento;

public record UploadDocumentoCommand(
    Guid ClienteId,
    TipoDocumentoEnum Tipo,
    FileUploadDto Arquivo
) : IRequest<Result<DocumentoDto>>;
