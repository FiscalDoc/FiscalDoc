using FluentValidation;
using VeloXML.Domain.Enums;

namespace VeloXML.Application.Features.Documentos.Commands.UploadDocumento;

public class UploadDocumentoCommandValidator : AbstractValidator<UploadDocumentoCommand>
{
    private static readonly string[] AllowedMimeTypes =
        ["text/xml", "application/xml", "application/pdf", "image/jpeg", "image/png", "image/webp"];

    public UploadDocumentoCommandValidator()
    {
        RuleFor(x => x.Tipo).IsInEnum();
        RuleFor(x => x.Arquivo).NotNull();
        RuleFor(x => x.Arquivo.Size)
            .LessThanOrEqualTo(50 * 1024 * 1024)
            .WithMessage("Arquivo não pode exceder 50 MB.");
        RuleFor(x => x.Arquivo.ContentType)
            .Must(ct => AllowedMimeTypes.Contains(ct))
            .WithMessage("Tipo de arquivo não permitido.");
    }
}
