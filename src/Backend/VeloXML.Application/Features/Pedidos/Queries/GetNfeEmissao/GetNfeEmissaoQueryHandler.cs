using MediatR;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Queries.GetNfeEmissao;

public sealed class GetNfeEmissaoQueryHandler(
    IUnitOfWork uow, IFocusNfeService focusNfe, NfeEmissaoFinalizer finalizer)
    : IRequestHandler<GetNfeEmissaoQuery, Result<NfeEmissaoDto?>>
{
    public async Task<Result<NfeEmissaoDto?>> Handle(GetNfeEmissaoQuery request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        var emissao = await uow.NfeEmissoes.GetLatestByPedidoAsync(request.PedidoId, ct);
        if (emissao is null)
            return Result.Success<NfeEmissaoDto?>(null);

        // Enquanto está "Processando", cada consulta do frontend (a tela fica pollando de 5 em
        // 5 segundos) já reconsulta a Focus NFe na hora, em vez de só ler o status gravado no
        // banco — sem isso, a tela só atualizava quando o webhook chegava ou quando o job de
        // segurança rodava (a cada 2 minutos), dando a impressão de que nunca atualizava sozinha.
        if (emissao.Status == NfeEmissaoStatusEnum.Processando)
        {
            var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
            if (cliente is not null)
            {
                try
                {
                    var resultado = await focusNfe.ConsultarNfeAsync(cliente, emissao.Ref, ct);
                    if (resultado.Concluida)
                        await finalizer.FinalizarAsync(emissao, cliente, resultado, ct);
                }
                catch
                {
                    // Mantém o status atual — a próxima consulta do frontend (em 5s) tenta de novo.
                }
            }
        }

        return Result.Success(EmitirNfeFocusCommandHandler.ToDto(emissao));
    }
}
