using MediatR;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.ContasReceber.Commands.CreateContaReceber;

public sealed class CreateContaReceberCommandHandler(IUnitOfWork uow)
    : IRequestHandler<CreateContaReceberCommand, Result<ContaReceberDto>>
{
    public async Task<Result<ContaReceberDto>> Handle(CreateContaReceberCommand request, CancellationToken ct)
    {
        if (request.ValorTotal <= 0)
            return Result.Failure<ContaReceberDto>(ResultError.Validation("ValorTotal", "O valor precisa ser maior que zero."));

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

        var conta = new ContaReceber
        {
            ClienteId = request.ClienteId,
            DestinatarioId = request.DestinatarioId,
            PedidoId = request.PedidoId,
            Descricao = request.Descricao,
            ValorTotal = request.ValorTotal,
            DataVencimento = request.DataVencimento,
            Observacao = request.Observacao,
        };

        await uow.ContasReceber.AddAsync(conta, ct);
        await uow.SaveChangesAsync(ct);

        return Result.Success(ToDto(conta, destinatario.RazaoSocial, pedido?.Numero));
    }

    internal static ContaReceberDto ToDto(ContaReceber c, string destinatarioNome, int? pedidoNumero)
    {
        var status = c.Status switch
        {
            StatusContaReceberEnum.Pendente when c.DataVencimento.Date < DateTime.UtcNow.Date => "Atrasado",
            StatusContaReceberEnum.Pendente => "Pendente",
            StatusContaReceberEnum.Pago => "Pago",
            StatusContaReceberEnum.Cancelado => "Cancelado",
            _ => "Pendente",
        };

        return new ContaReceberDto(
            c.Id, c.ClienteId, c.DestinatarioId, destinatarioNome, c.PedidoId, pedidoNumero,
            c.Descricao, c.ValorTotal, c.DataVencimento, c.DataPagamento,
            status, c.FormaPagamento, c.Observacao, c.CreatedAt);
    }
}
