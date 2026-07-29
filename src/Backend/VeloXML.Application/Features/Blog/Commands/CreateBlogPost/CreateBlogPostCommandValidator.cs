using FluentValidation;

namespace VeloXML.Application.Features.Blog.Commands.CreateBlogPost;

public class CreateBlogPostCommandValidator : AbstractValidator<CreateBlogPostCommand>
{
    public CreateBlogPostCommandValidator()
    {
        RuleFor(x => x.Titulo).NotEmpty().WithMessage("Informe o título da postagem.").MaximumLength(200);
        RuleFor(x => x.Conteudo).NotEmpty().WithMessage("O conteúdo da postagem não pode ficar vazio.");
        RuleFor(x => x.Autor).NotEmpty().WithMessage("Informe o autor da postagem.");
        RuleFor(x => x.Resumo).MaximumLength(500);
        RuleFor(x => x.Slug)
            .Matches("^[a-z0-9]+(-[a-z0-9]+)*$").WithMessage("O slug deve conter apenas letras minúsculas, números e hífens.")
            .When(x => !string.IsNullOrWhiteSpace(x.Slug));
        RuleFor(x => x.Status).Must(s => s is "Rascunho" or "Publicado").WithMessage("Status inválido.");
    }
}
