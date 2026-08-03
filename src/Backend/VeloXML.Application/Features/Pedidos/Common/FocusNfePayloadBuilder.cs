using VeloXML.Domain.Entities;

namespace VeloXML.Application.Features.Pedidos.Common;

// Monta o corpo JSON de POST /nfe da Focus NFe a partir do Pedido já carregado com
// Itens+Produto e Destinatario (via IPedidoRepository.GetWithItensAsync). Schema baseado na
// documentação pública da Focus — os códigos de situação tributária (CST/CSOSN) usam um
// padrão conservador de Simples Nacional e precisam ser revisados contra a conta real (ver
// plano, questão em aberto #1); os demais campos (destinatário, itens, valores) vêm direto do
// cadastro existente, sem gap de dados.
internal static class FocusNfePayloadBuilder
{
    public static object Montar(Cliente cliente, Pedido pedido)
    {
        var destinatario = pedido.Destinatario!;
        var cpfCnpjDigitos = SoDigitos(destinatario.CpfCnpj);

        return new
        {
            natureza_operacao = pedido.NaturezaOperacao,
            data_emissao = DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz"),
            tipo_documento = 1,      // 1 = saída
            finalidade_emissao = 1,  // 1 = NF-e normal
            presenca_comprador = 9,  // 9 = não se aplica (operação não presencial)
            cnpj_emitente = SoDigitos(cliente.Cnpj),

            cnpj_destinatario = cpfCnpjDigitos?.Length == 14 ? cpfCnpjDigitos : null,
            cpf_destinatario = cpfCnpjDigitos?.Length == 11 ? cpfCnpjDigitos : null,
            nome_destinatario = destinatario.RazaoSocial,
            inscricao_estadual_destinatario = destinatario.InscricaoEstadual,
            logradouro_destinatario = destinatario.Logradouro,
            numero_destinatario = destinatario.Numero,
            complemento_destinatario = destinatario.Complemento,
            bairro_destinatario = destinatario.Bairro,
            municipio_destinatario = destinatario.Cidade,
            uf_destinatario = destinatario.Estado,
            cep_destinatario = SoDigitos(destinatario.Cep),
            codigo_municipio_destinatario = destinatario.CodigoIbgeCidade,
            telefone_destinatario = destinatario.Telefone,
            email_destinatario = destinatario.Email,

            items = pedido.Itens.Select((item, i) => new
            {
                numero_item = i + 1,
                codigo_produto = item.Produto?.Codigo ?? item.ProdutoId.ToString(),
                descricao = item.Descricao,
                cfop = item.Cfop,
                ncm = item.Ncm,
                unidade_comercial = item.Unidade,
                quantidade_comercial = item.Quantidade,
                valor_unitario_comercial = item.PrecoUnitario,
                valor_bruto = item.ValorTotal,
                unidade_tributavel = item.Unidade,
                quantidade_tributavel = item.Quantidade,
                valor_unitario_tributavel = item.PrecoUnitario,
                icms_origem = "0",
                icms_situacao_tributaria = "102", // CSOSN Simples Nacional sem crédito — ajustar por regime
                pis_situacao_tributaria = "07",
                cofins_situacao_tributaria = "07",
            }).ToList(),
        };
    }

    private static string? SoDigitos(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : new string(valor.Where(char.IsDigit).ToArray());
}
