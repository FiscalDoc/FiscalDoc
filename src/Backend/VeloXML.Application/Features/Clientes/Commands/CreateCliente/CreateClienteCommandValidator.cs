using FluentValidation;

namespace VeloXML.Application.Features.Clientes.Commands.CreateCliente;

public class CreateClienteCommandValidator : AbstractValidator<CreateClienteCommand>
{
    public CreateClienteCommandValidator()
    {
        RuleFor(x => x.RazaoSocial).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Cnpj).NotEmpty().Length(14).Matches(@"^\d+$").WithMessage("CNPJ deve conter apenas dígitos (14 dígitos).");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
        // ContadorId é opcional no request — o handler usa currentUser.ContadorId como fallback
    }
}
