using VeloXML.Domain.Interfaces;

namespace VeloXML.Application.Features.Assistente.Common;

// Monta um resumo em português do que está OK/faltando pro cliente/pedido atual, reaproveitando
// as mesmas checagens já usadas nas validações de emissão (RegistrarCertificadoNfeCommandHandler,
// EmitirNfeFocusCommandHandler) — o assistente só EXPLICA esse diagnóstico, nunca corrige nada
// sozinho (v1 é orientação, não execução de ações).
internal static class DiagnosticoContextoBuilder
{
    public static async Task<string> MontarAsync(IUnitOfWork uow, Guid? clienteId, Guid? pedidoId, CancellationToken ct)
    {
        if (clienteId is null)
            return "Nenhum cliente selecionado no momento — o usuário está navegando fora do contexto de um cliente específico.";

        var cliente = await uow.Clientes.GetByIdAsync(clienteId.Value, ct);
        if (cliente is null)
            return "Cliente não encontrado (pode ter sido removido ou o usuário não tem mais acesso a ele).";

        var linhas = new List<string>
        {
            $"Cliente atual: {cliente.RazaoSocial} (CNPJ {cliente.Cnpj}).",
            cliente.NfeHabilitado
                ? "Emissão de NF-e HABILITADA pelo administrador."
                : "Emissão de NF-e NÃO habilitada — só o Administrador consegue habilitar isso, na tela do cliente.",
            cliente.FocusNfeStatus == "Registrada"
                ? "Certificado digital já registrado e ativo."
                : $"Certificado digital com status \"{cliente.FocusNfeStatus}\" — precisa concluir o registro na tela Empresa, aba Fiscal.",
        };

        if (string.IsNullOrWhiteSpace(cliente.InscricaoEstadual)) linhas.Add("Falta preencher a Inscrição Estadual (tela Empresa, aba Fiscal).");
        if (string.IsNullOrWhiteSpace(cliente.RegimeTributario)) linhas.Add("Falta definir o Regime Tributário (tela Empresa, aba Fiscal).");
        if (string.IsNullOrWhiteSpace(cliente.Logradouro) || string.IsNullOrWhiteSpace(cliente.Cep)) linhas.Add("Endereço fiscal incompleto (tela Empresa, aba Endereço).");

        if (pedidoId is null) return string.Join("\n", linhas);

        var pedido = await uow.Pedidos.GetWithItensAsync(pedidoId.Value, ct);
        if (pedido is null)
        {
            linhas.Add("O pedido referenciado não foi encontrado.");
            return string.Join("\n", linhas);
        }

        linhas.Add($"Pedido atual: nº {pedido.Numero}, status \"{pedido.Status}\".");
        if (pedido.Itens.Count == 0)
        {
            linhas.Add("Esse pedido ainda não tem nenhum item.");
            return string.Join("\n", linhas);
        }

        var regimeNormalExigeIbsCbs = cliente.RegimeTributario is "LucroReal" or "LucroPresumido";
        foreach (var item in pedido.Itens)
        {
            var faltando = new List<string>();
            if (string.IsNullOrWhiteSpace(item.Ncm)) faltando.Add("NCM");
            if (string.IsNullOrWhiteSpace(item.Cfop)) faltando.Add("CFOP");
            if (string.IsNullOrWhiteSpace(item.CstIcms)) faltando.Add("CST/CSOSN do ICMS");
            if (string.IsNullOrWhiteSpace(item.CstPis)) faltando.Add("CST do PIS");
            if (string.IsNullOrWhiteSpace(item.CstCofins)) faltando.Add("CST do COFINS");
            if (regimeNormalExigeIbsCbs && (string.IsNullOrWhiteSpace(item.IbsCbsCst) || string.IsNullOrWhiteSpace(item.IbsCbsClassificacaoTributaria)))
                faltando.Add("classificação de IBS/CBS (obrigatória pro regime Normal desde 03/08/2026)");

            linhas.Add(faltando.Count == 0
                ? $"Item \"{item.Descricao}\": dados fiscais completos."
                : $"Item \"{item.Descricao}\" está sem: {string.Join(", ", faltando)} — precisa completar no cadastro do produto.");
        }

        return string.Join("\n", linhas);
    }
}
