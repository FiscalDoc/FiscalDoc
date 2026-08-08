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
        if (string.IsNullOrWhiteSpace(cliente.InscricaoEstadual))
            return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                "InscricaoEstadual", "Preencha a Inscrição Estadual da empresa na tela Empresa (aba Fiscal) antes de emitir."));

        // Confere NCM/CFOP/CST de cada item ANTES de chamar a Focus — sem isso, a rejeição só
        // aparece depois de ida e volta pra API deles, com uma mensagem bem menos clara sobre
        // qual produto especificamente está incompleto ou errado. Prioriza o cadastro ATUAL do
        // Produto (item.Produto) sobre a "foto" gravada no PedidoItem em vez de exigir só o
        // snapshot — sem isso, completar o cadastro fiscal do produto DEPOIS de ele já estar
        // num pedido rascunho nunca refletia aqui, travando a emissão com dado já corrigido.
        //
        // Não basta o campo estar preenchido — precisa ser um código plausível. "0" passa numa
        // checagem de "não vazio" mas a SEFAZ rejeita na hora (CST de PIS/COFINS tem 2 dígitos;
        // ICMS é CST de 2 dígitos pro regime Normal ou CSOSN de 3 dígitos pro Simples
        // Nacional/MEI — usar o tamanho errado é rejeição certa: "Informado CST para emissor do
        // Simples Nacional").
        var regimeNormal = cliente.RegimeTributario is "LucroReal" or "LucroPresumido";
        var tamanhoIcmsEsperado = regimeNormal ? 2 : 3;
        var tipoIcmsEsperado = regimeNormal ? "CST" : "CSOSN";

        // IBS/CBS só é obrigatório na NF-e a partir de 03/08/2026 pra empresas do regime
        // Normal — Simples Nacional (1/2) e MEI (4) só entram a partir de 04/2027 (LC
        // 214/2025). Não trava a emissão desses clientes por um campo que ainda não é exigível.
        var regimeNormalExigeIbsCbs = regimeNormal;

        // Os nomes de campo abaixo ("itens.N.codigo_ncm" etc.) seguem de propósito a MESMA
        // convenção que a Focus usa no array "erros" de uma rejeição real da SEFAZ — o
        // frontend já sabe transformar esse formato num link direto pro cadastro do produto
        // (ver _explicarErroNfe em pedido-form.component.ts), então essa checagem antecipada
        // ganha o mesmo tratamento visual sem precisar de nenhum caso novo lá.
        var i = 0;
        foreach (var item in pedido.Itens)
        {
            i++;
            var prefixo = $"itens.{i}";
            var ncm = item.Produto?.Ncm ?? item.Ncm;
            var cfop = item.Produto?.Cfop ?? item.Cfop;
            var cstIcms = item.Produto?.CstIcms ?? item.CstIcms;
            var cstPis = item.Produto?.CstPis ?? item.CstPis;
            var cstCofins = item.Produto?.CstCofins ?? item.CstCofins;

            if (string.IsNullOrWhiteSpace(ncm))
                return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                    $"{prefixo}.codigo_ncm", $"O produto \"{item.Descricao}\" está sem NCM — preencha no cadastro do produto antes de emitir."));
            if (string.IsNullOrWhiteSpace(cfop))
                return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                    $"{prefixo}.cfop", $"O produto \"{item.Descricao}\" está sem CFOP — preencha no cadastro do produto antes de emitir."));

            if (!CodigoValido(cstIcms, tamanhoIcmsEsperado))
                return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                    $"{prefixo}.cst_icms",
                    $"O produto \"{item.Descricao}\" tem um {tipoIcmsEsperado} de ICMS inválido (\"{cstIcms}\") — " +
                    $"precisa ter {tamanhoIcmsEsperado} dígitos numéricos, já que a empresa é do regime " +
                    $"{(regimeNormal ? "Normal" : "Simples Nacional/MEI")}. Corrija no cadastro do produto."));

            if (!CodigoValido(cstPis, 2))
                return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                    $"{prefixo}.cst_pis", $"O produto \"{item.Descricao}\" tem um CST de PIS inválido (\"{cstPis}\") — precisa ter 2 dígitos numéricos (ex.: 07, 99). Corrija no cadastro do produto."));

            if (!CodigoValido(cstCofins, 2))
                return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                    $"{prefixo}.cst_cofins", $"O produto \"{item.Descricao}\" tem um CST de COFINS inválido (\"{cstCofins}\") — precisa ter 2 dígitos numéricos (ex.: 07, 99). Corrija no cadastro do produto."));

            if (regimeNormalExigeIbsCbs)
            {
                var ibsCbsCst = item.Produto?.IbsCbsCst ?? item.IbsCbsCst;
                var ibsCbsClassificacao = item.Produto?.IbsCbsClassificacaoTributaria ?? item.IbsCbsClassificacaoTributaria;
                if (string.IsNullOrWhiteSpace(ibsCbsCst) || string.IsNullOrWhiteSpace(ibsCbsClassificacao))
                    return Result.Failure<NfeEmissaoDto>(ResultError.Validation(
                        $"{prefixo}.ibs_cbs", $"O produto \"{item.Descricao}\" está sem a classificação de IBS/CBS — obrigatória pra empresas do regime Normal a partir de 03/08/2026. Preencha no cadastro do produto."));
            }
        }

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

    private static bool CodigoValido(string? valor, int tamanhoEsperado) =>
        !string.IsNullOrWhiteSpace(valor) && valor.Length == tamanhoEsperado && valor.All(char.IsDigit);

    internal static NfeEmissaoDto ToDto(NfeEmissao e) => new(
        e.Id, e.Status.ToString(), e.MensagemErro, e.ChaveAcesso, e.Numero, e.Serie, e.DocumentoId, e.CreatedAt,
        string.IsNullOrEmpty(e.ErrosDetalhadosJson)
            ? null
            : JsonSerializer.Deserialize<List<NfeCampoErroDto>>(e.ErrosDetalhadosJson));
}
