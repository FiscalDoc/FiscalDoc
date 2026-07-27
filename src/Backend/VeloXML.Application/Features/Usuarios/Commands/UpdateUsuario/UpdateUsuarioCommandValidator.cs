using FluentValidation;

namespace VeloXML.Application.Features.Usuarios.Commands.UpdateUsuario;

public class UpdateUsuarioCommandValidator : AbstractValidator<UpdateUsuarioCommand>
{
    public UpdateUsuarioCommandValidator()
    {
        RuleFor(x => x.Nome).NotEmpty().WithMessage("Nome é obrigatório.").MaximumLength(200);
        RuleFor(x => x.NovaSenha)
            .MinimumLength(8).WithMessage("Senha deve ter ao menos 8 caracteres.")
            .When(x => !string.IsNullOrWhiteSpace(x.NovaSenha));
    }
}
