using FluentValidation;

namespace VeloXML.Application.Features.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NovaSenha).NotEmpty().MinimumLength(8).WithMessage("A senha deve ter no mínimo 8 caracteres.");
    }
}
