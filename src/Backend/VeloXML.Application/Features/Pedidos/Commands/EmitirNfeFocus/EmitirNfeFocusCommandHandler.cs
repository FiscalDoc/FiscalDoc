using System.Text.Json;
using MediatR;
using Microsoft.Extensions.Logging;
using VeloXML.Application.Common.Interfaces;
using VeloXML.Application.Features.Pedidos.Common;
using VeloXML.Domain.Entities;
using VeloXML.Domain.Enums;
using VeloXML.Domain.Exceptions;
using VeloXML.Domain.Interfaces;
using VeloXML.SharedKernel;

namespace VeloXML.Application.Features.Pedidos.Commands.EmitirNfeFocus;

public sealed class EmitirNfeFocusCommandHandler(
    IUnitOfWork uow,
    IFocusNfeService focusNfe,
    NfeEmissaoFinalizer finalizer,
    ICurrentUser currentUser,
    ILogger<EmitirNfeFocusCommandHandler> logger) : IRequestHandler<EmitirNfeFocusCommand, Result<NfeEmissaoDto>>
{
    public async Task<Result<NfeEmissaoDto>> Handle(EmitirNfeFocusCommand request, CancellationToken ct)
    {
        var pedido = await uow.Pedidos.GetWithItensAsync(request.PedidoId, ct);
        if (pedido is null || pedido.ClienteId != request.ClienteId)
            throw new NotFoundException("Pedido", request.PedidoId);

        if (pedido.Status != "Rascunho")
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation("Status", "Apenas pedidos em rascunho podem emitir NF-e."));
        if (pedido.Itens.Count == 0)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation("Itens", "Adicione pelo menos um item antes de emitir a NF-e."));
        if (pedido.Destinatario is null)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation("Destinatario", "Pedido sem destinatário."));

        var cliente = await uow.Clientes.GetByIdAsync(request.ClienteId, ct);
        if (cliente is null)
            return Result.Failure<NfeEmissaoDto>(ResultError.NotFound("Cliente"));

        if (!cliente.NfeHabilitado)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "NfeHabilitado", "A emissão de NF-e não está habilitada para este cliente. Fale com o administrador."));
        if (cliente.FocusNfeStatus != "Registrada")
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "FocusNfeStatus", "O certificado digital ainda não foi registrado. Configure-o na tela Empresa antes de emitir."));

        // Confere NCM/CFOP de cada item ANTES de chamar a Focus — sem isso, a rejeição só
        // aparece depois de ida e volta pra API deles, com uma mensagem bem menos clara sobre
        // qual produto especificamente está incompleto.
        var itemIncompleto = pedido.Itens.FirstOrDefault(i => string.IsNullOrWhiteSpace(i.Ncm) || string.IsNullOrWhiteSpace(i.Cfop));
        if (itemIncompleto is not null)
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "Itens", $"O produto \"{itemIncompleto.Descricao}\" está sem NCM ou CFOP — preencha no cadastro do produto antes de emitir."));

        var solicitadoPorNome = currentUser.Name ?? currentUser.Email ?? "FiscalDoc";

        var refId = $"pedido-{pedido.Id:N}-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var emissao = new NfeEmissao
        {
            TenantId          = pedido.TenantId,
            PedidoId          = pedido.Id,
            ClienteId         = cliente.Id,
            Ref               = refId,
            Ambiente          = cliente.FocusNfeAmbiente,
            Status            = NfeEmissaoStatusEnum.Enviada,
            SolicitadoPorNome = solicitadoPorNome,
        };
        await uow.NfeEmissoes.AddAsync(emissao, ct);
        await uow.SaveChangesAsync(ct);

        var payload = FocusNfePayloadBuilder.Montar(cliente, pedido);
        FocusNfeSubmissaoResult resultado;
        try
        {
            resultado = await focusNfe.EmitirNfeAsync(cliente, refId, payload, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Falha ao chamar a Focus NFe pro pedido {PedidoId}", pedido.Id);
            emissao.Status = NfeEmissaoStatusEnum.Erro;
            emissao.MensagemErro = "Não foi possível emitir a NF-e agora. Tente novamente em instantes.";
            uow.NfeEmissoes.Update(emissao);
            await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
            {
                TenantId    = pedido.TenantId,
                PedidoId    = pedido.Id,
                Tipo        = "ErroEmissaoNfe",
                Descricao   = "Falha ao tentar emitir a NF-e — não foi possível se comunicar com o serviço de emissão.",
                UsuarioNome = solicitadoPorNome,
            }, ct);
            await uow.SaveChangesAsync(ct);
            return Result.Success(ToDto(emissao));
        }

        if (!resultado.Concluida)
        {
            emissao.Status = NfeEmissaoStatusEnum.Processando;
            emissao.UltimoPayloadRespostaJson = resultado.RespostaBrutaJson;
            uow.NfeEmissoes.Update(emissao);
            await uow.PedidoHistoricos.AddAsync(new PedidoHistorico
            {
                TenantId    = pedido.TenantId,
                PedidoId    = pedido.Id,
                Tipo        = "NfeProcessando",
                Descricao   = "Emissão de NF-e enviada — processando na SEFAZ.",
                UsuarioNome = solicitadoPorNome,
            }, ct);
            await uow.SaveChangesAsync(ct);
            return Result.Success(ToDto(emissao));
        }

        await finalizer.FinalizarAsync(emissao, cliente, resultado, ct);
        return Result.Success(ToDto(emissao));
    }

    internal static NfeEmissaoDto ToDto(NfeEmissao e) => new(
        e.Id, e.Status.ToString(), e.MensagemErro, e.ChaveAcesso, e.Numero, e.Serie, e.DocumentoId, e.CreatedAt,
        string.IsNullOrEmpty(e.ErrosDetalhadosJson)
            ? null
            : JsonSerializer.Deserialize<List<NfeCampoErroDto>>(e.ErrosDetalhadosJson));
}
