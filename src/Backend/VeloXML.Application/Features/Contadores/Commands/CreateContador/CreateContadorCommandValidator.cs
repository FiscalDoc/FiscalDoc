using FluentValidation;

namespace VeloXML.Application.Features.Contadores.Commands.CreateContador;

public class CreateContadorCommandValidator : AbstractValidator<CreateContadorCommand>
{
    public CreateContadorCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.Telefone).MaximumLength(20).When(x => x.Telefone is not null);
        RuleFor(x => x.CanalNotificacao).Must(c => new[] { "ambos", "email", "whatsapp" }.Contains(c))
            .WithMessage("Canal deve ser 'ambos', 'email' ou 'whatsapp'.");
    }
}
