using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.ProcessarWebhookFocusNfe;

// A Focus não documenta assinatura no corpo do webhook — o secret na URL (validado no
// controller antes de chegar aqui) já garante que a chamada é legítima. Por isso este handler
// não confia em nenhum dado do corpo além do "ref": ele reconsulta a Focus pra pegar o status
// autoritativo em vez de tentar decodificar o schema do payload de webhook (não documentado).
public sealed class ProcessarWebhookFocusNfeCommandHandler(
    IUnitOfWork uow,
    IFocusNfeService focusNfe,
    NfeEmissaoFinalizer finalizer,
    ILogger<ProcessarWebhookFocusNfeCommandHandler> logger) : IRequestHandler<ProcessarWebhookFocusNfeCommand, Result>
{
    public async Task<Result> Handle(ProcessarWebhookFocusNfeCommand request, CancellationToken ct)
    {
        var emissao = await uow.NfeEmissoes.GetByRefAsync(request.Ref, ct);
        if (emissao is null)
        {
            logger.LogWarning("Webhook Focus NFe recebido com ref desconhecida: {Ref}", request.Ref);
            return Result.Success();
        }

        // Reentrega da Focus (retry schedule deles) numa emissão já finalizada — no-op.
        if (emissao.Status is not (NfeEmissaoStatusEnum.Enviada or NfeEmissaoStatusEnum.Processando))
            return Result.Success();

        var cliente = await uow.Clientes.GetByIdAsync(emissao.ClienteId, ct);
        if (cliente is null)
            return Result.Success();

        var resultado = await focusNfe.ConsultarNfeAsync(cliente, request.Ref, ct);
        if (!resultado.Concluida)
            return Result.Success();

        await finalizer.FinalizarAsync(emissao, cliente, resultado, ct);
        return Result.Success();
    }
}
