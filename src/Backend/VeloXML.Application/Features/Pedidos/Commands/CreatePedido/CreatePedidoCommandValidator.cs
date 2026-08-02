using FluentValidation;

namespace VeloXML.Application.Features.Pedidos.Commands.CreatePedido;

public class CreatePedidoCommandValidator : AbstractValidator<CreatePedidoCommand>
{
    public CreatePedidoCommandValidator()
    {
        RuleFor(x => x.DestinatarioId).NotEqual(Guid.Empty).WithMessage("Selecione um destinatário.");
        RuleFor(x => x.Itens).NotEmpty().WithMessage("Adicione pelo menos um item ao pedido.");
        RuleFor(x => x.NaturezaOperacao).NotEmpty().WithMessage("Informe a natureza da operação.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId).NotEqual(Guid.Empty).WithMessage("Selecione um produto para o item.");
            item.RuleFor(i => i.Descricao).NotEmpty().WithMessage("Descrição do item é obrigatória.");
            item.RuleFor(i => i.Unidade).NotEmpty().WithMessage("Unidade do item é obrigatória.");
            item.RuleFor(i => i.Quantidade).GreaterThan(0).WithMessage("Quantidade do item deve ser maior que zero.");
            item.RuleFor(i => i.PrecoUnitario).GreaterThanOrEqualTo(0).WithMessage("Preço unitário do item não pode ser negativo.");
            item.RuleFor(i => i.Desconto).GreaterThanOrEqualTo(0).WithMessage("Desconto do item não pode ser negativo.");
            item.RuleFor(i => i.Desconto)
                .Must((i, desconto) => desconto <= i.Quantidade * i.PrecoUnitario)
                .WithMessage("Desconto não pode ser maior que o valor do item (quantidade × preço unitário).");
        });
    }
}
