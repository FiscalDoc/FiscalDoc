using FluentValidation;

namespace VeloXML.Application.Features.Auth.Commands.ChangePassword;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.SenhaAtual).NotEmpty().WithMessage("Informe sua senha atual.");
        RuleFor(x => x.NovaSenha).NotEmpty().MinimumLength(8).WithMessage("A nova senha deve ter no mínimo 8 caracteres.");
    }
}
