using FluentValidation;

namespace VeloXML.Application.Features.Clientes.Commands.UpdateCliente;

public class UpdateClienteCommandValidator : AbstractValidator<UpdateClienteCommand>
{
    public UpdateClienteCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.RazaoSocial).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
    }
}
