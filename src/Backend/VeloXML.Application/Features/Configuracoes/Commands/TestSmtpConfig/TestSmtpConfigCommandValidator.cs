using FluentValidation;

namespace VeloXML.Application.Features.Configuracoes.Commands.TestSmtpConfig;

public class TestSmtpConfigCommandValidator : AbstractValidator<TestSmtpConfigCommand>
{
    public TestSmtpConfigCommandValidator()
    {
        RuleFor(x => x.Host).NotEmpty().WithMessage("Informe o servidor SMTP.");
        RuleFor(x => x.Port).InclusiveBetween(1, 65535).WithMessage("Porta inválida.");
        RuleFor(x => x.From).NotEmpty().EmailAddress().WithMessage("Informe um e-mail remetente válido.");
        RuleFor(x => x.EmailDestino).NotEmpty().EmailAddress().WithMessage("Informe um e-mail de destino válido para o teste.");
    }
}
