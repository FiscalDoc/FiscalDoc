using FluentValidation;

namespace VeloXML.Application.Features.Pedidos.Commands.UpdatePedido;

public class UpdatePedidoCommandValidator : AbstractValidator<UpdatePedidoCommand>
{
    public UpdatePedidoCommandValidator()
    {
        RuleFor(x => x.DestinatarioId).NotEqual(Guid.Empty).WithMessage("Selecione um destinatário.");
        RuleFor(x => x.Itens).NotEmpty().WithMessage("Adicione pelo menos um item ao pedido.");

        RuleForEach(x => x.Itens).ChildRules(item =>
        {
            item.RuleFor(i => i.ProdutoId).NotEqual(Guid.Empty).WithMessage("Selecione um produto para o item.");
            item.RuleFor(i => i.Descricao).NotEmpty().WithMessage("Descrição do item é obrigatória.");
            item.RuleFor(i => i.Unidade).NotEmpty().WithMessage("Unidade do item é obrigatória.");
            item.RuleFor(i => i.Quantidade).GreaterThan(0).WithMessage("Quantidade do item deve ser maior que zero.");
            item.RuleFor(i => i.PrecoUnitario).GreaterThanOrEqualTo(0).WithMessage("Preço unitário do item não pode ser negativo.");
            item.RuleFor(i => i.Desconto).GreaterThanOrEqualTo(0).WithMessage("Desconto do item não pode ser negativo.");
        });
    }
}
