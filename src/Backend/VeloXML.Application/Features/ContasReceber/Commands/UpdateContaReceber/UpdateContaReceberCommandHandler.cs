using MediatR;
using VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.UpdateContaReceber;

public sealed class UpdateContaReceberCommandHandler(IUnitOfWork uow)
    : IRequestHandler<UpdateContaReceberCommand, Result<ContaReceberDto>>
{
    public async Task<Result<ContaReceberDto>> Handle(UpdateContaReceberCommand request, CancellationToken ct)
    {
        if (request.ValorTotal <= 0)
            return Result.Failure<ContaReceberDto>(ResultError.Validation("ValorTotal", "O valor precisa ser maior que zero."));

        var conta = await uow.ContasReceber.GetByIdAsync(request.Id, ct);
        if (conta is null || conta.ClienteId != request.ClienteId)
            throw new NotFoundException("Conta a receber", request.Id);

        var destinatario = await uow.Destinatarios.GetByIdAsync(request.DestinatarioId, ct);
        if (destinatario is null || destinatario.ClienteId != request.ClienteId)
            return Result.Failure<ContaReceberDto>(ResultError.Validation("DestinatarioId", "Destinatário não encontrado."));

        Pedido? pedido = null;
        if (request.PedidoId.HasValue)
        {
            pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId.Value, ct);
            if (pedido is null || pedido.ClienteId != request.ClienteId)
                return Result.Failure<ContaReceberDto>(ResultError.Validation("PedidoId", "Pedido não encontrado."));
        }

        conta.DestinatarioId = request.DestinatarioId;
        conta.PedidoId = request.PedidoId;
        conta.Descricao = request.Descricao;
        conta.ValorTotal = request.ValorTotal;
        conta.DataVencimento = request.DataVencimento;
        conta.Observacao = request.Observacao;

        uow.ContasReceber.Update(conta);
        await uow.SaveChangesAsync(ct);

        return Result.Success(CreateContaReceberCommandHandler.ToDto(conta, destinatario.RazaoSocial, pedido?.Numero));
    }
}
