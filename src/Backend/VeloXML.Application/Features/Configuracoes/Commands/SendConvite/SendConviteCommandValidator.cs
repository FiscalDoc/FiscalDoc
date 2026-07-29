using FluentValidation;

namespace VeloXML.Application.Features.Configuracoes.Commands.SendConvite;

public class SendConviteCommandValidator : AbstractValidator<SendConviteCommand>
{
    public SendConviteCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Informe o nome do convidado.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Informe um e-mail válido.");
    }
}
