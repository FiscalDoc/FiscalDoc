using FluentValidation;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveSocialConfig;

public class SaveSocialConfigCommandValidator : AbstractValidator<SaveSocialConfigCommand>
{
    public SaveSocialConfigCommandValidator()
    {
        RuleFor(x => x.Instagram).Must(SerUrlValida).WithMessage("Link do Instagram inválido. Use uma URL começando com http:// ou https://.");
        RuleFor(x => x.Facebook).Must(SerUrlValida).WithMessage("Link do Facebook inválido. Use uma URL começando com http:// ou https://.");
        RuleFor(x => x.Linkedin).Must(SerUrlValida).WithMessage("Link do LinkedIn inválido. Use uma URL começando com http:// ou https://.");
        RuleFor(x => x.Tiktok).Must(SerUrlValida).WithMessage("Link do TikTok inválido. Use uma URL começando com http:// ou https://.");
    }

    private static bool SerUrlValida(string? valor) =>
        string.IsNullOrWhiteSpace(valor) || Uri.IsWellFormedUriString(valor, UriKind.Absolute);
}
