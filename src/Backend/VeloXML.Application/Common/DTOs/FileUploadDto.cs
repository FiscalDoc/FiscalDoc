namespace VeloXML.Application.Common.DTOs;

public record FileUploadDto(
    Stream Content,
    string FileName,
    string ContentType,
    long Size
);
