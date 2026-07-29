using FluentValidation;

namespace VeloXML.Application.Features.Contadores.Commands.CriarCobrancaManual;

public class CriarCobrancaManualCommandValidator : AbstractValidator<CriarCobrancaManualCommand>
{
    public CriarCobrancaManualCommandValidator()
    {
        RuleFor(x => x)
            .Must(x => (x.ContadorId.HasValue) ^ (x.ClienteId.HasValue))
            .WithMessage("Selecione um Contador ou um Cliente (não os dois).");
        RuleFor(x => x.Mes).InclusiveBetween(1, 12).WithMessage("Mês inválido.");
        RuleFor(x => x.Ano).InclusiveBetween(2020, 2100).WithMessage("Ano inválido.");
        RuleFor(x => x.ValorTotal).GreaterThan(0).WithMessage("Informe um valor maior que zero.");
    }
}
