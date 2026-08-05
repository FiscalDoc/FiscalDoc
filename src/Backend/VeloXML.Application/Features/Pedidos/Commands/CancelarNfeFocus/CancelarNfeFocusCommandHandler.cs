using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.CancelarNfeFocus;

public sealed class CancelarNfeFocusCommandHandler(
    IUnitOfWork uow,
    IFocusNfeService focusNfe,
    ICurrentUser currentUser,
    ILogger<CancelarNfeFocusCommandHandler> logger) : IRequestHandler<CancelarNfeFocusCommand, Result<NfeEmissaoDto>>
{
    public async Task<Result<NfeEmissaoDto>> Handle(CancelarNfeFocusCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetByIdAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        // 15-255 é a faixa que a própria SEFAZ exige pro texto de justificativa (campo xMotivo
        // do evento de cancelamento) — confere aqui antes de gastar uma chamada com a Focus.
        var justificativa = request.Justificativa.Trim();
        if (justificativa.Length < 15 || justificativa.Length > 255)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "Justificativa", "A justificativa precisa ter entre 15 e 255 caracteres."));

        var emissao = await uow.NfeEmissoes.GetLatestByPedidoAsync(pedido.Id, ct);
        if (emissao is null || emissao.Status != NfeEmissaoStatusEnum.Autorizada)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "Status", "Só é possível cancelar uma NF-e que já foi autorizada."));

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<NfeEmissaoDto>(ResultError.NotFound("Cliente"));

        var resultado = await focusNfe.CancelarNfeAsync(cliente, emissao.Ref, justificativa, ct);
        if (!resultado.Sucesso)
        {
            logger.LogWarning(
                "Cancelamento da NfeEmissao {Id} (ref {Ref}) rejeitado: {Erro}",
                emissao.Id, emissao.Ref, resultado.MensagemErro);
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "Cancelamento", resultado.MensagemErro ?? "Não foi possível cancelar a NF-e agora. Tente novamente em instantes."));
        }

        emissao.Status = NfeEmissaoStatusEnum.Cancelada;
        uow.NfeEmissoes.Update(emissao);

        if (emissao.DocumentoId.HasValue)
        {
            var documento = await uow.Documentos.GetByIdAsync(emissao.DocumentoId.Value, ct);
            if (documento is not null)
            {
                documento.Status = StatusDocumentoEnum.Cancelado;
                documento.MotivoCancelamento = justificativa;
                documento.DataCancelamento = DateTime.UtcNow;
                uow.Documentos.Update(documento);
            }
        }

        await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
        {
            TenantId    = pedido.TenantId,
            PedidoId    = pedido.Id,
            Tipo        = "NfeCancelada",
            Descricao   = $"NF-e cancelada: {justificativa}",
            UsuarioNome = currentUser.Name ?? currentUser.Email ?? "FiscalDoc",
        }, ct);

        await uow.SaveChangesAsync(ct);

        return Result.Success(EmitirNfeFocusCommandHandler.ToDto(emissao));
    }
}
