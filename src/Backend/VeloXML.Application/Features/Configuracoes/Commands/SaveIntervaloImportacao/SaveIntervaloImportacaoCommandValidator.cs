using FluentValidation;

namespace VeloXML.Application.Features.Configuracoes.Commands.SaveIntervaloImportacao;

public class SaveIntervaloImportacaoCommandValidator : AbstractValidator<SaveIntervaloImportacaoCommand>
{
    public SaveIntervaloImportacaoCommandValidator()
    {
        RuleFor(x => x.IntervaloMinutos)
            .InclusiveBetween(1, 1440)
            .WithMessage("O intervalo deve ser entre 1 e 1440 minutos (24 horas).");
    }
}
