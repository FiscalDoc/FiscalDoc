using FluentValidation;

namespace VeloXML.Application.Features.Pedidos.Commands.CorrigirNfeFocus;

public class CorrigirNfeFocusCommandValidator : AbstractValidator<CorrigirNfeFocusCommand>
{
    public CorrigirNfeFocusCommandValidator()
    {
        // 15-1000 é a faixa que a SEFAZ exige pro texto de correção (campo xCorrecao do evento
        // de Carta de Correção) — conferido aqui antes de gastar uma chamada com a Focus.
        RuleFor(x => x.Correcao)
            .NotEmpty().WithMessage("Informe o texto da correção.")
            .MinimumLength(15).WithMessage("A correção precisa ter pelo menos 15 caracteres.")
            .MaximumLength(1000).WithMessage("A correção não pode ter mais de 1000 caracteres.");
    }
}
