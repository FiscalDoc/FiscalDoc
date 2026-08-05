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
        // Pessoa física (CPF) NUNCA pode ser Contribuinte ICMS (indIEDest=1) — mesmo que
        // sobre algum valor no campo IE do cadastro, não conta. Sem essa checagem, um
        // destinatário CPF com IE preenchida por engano manda indicador=1 com uma IE que a
        // SEFAZ não aceita como válida pra pessoa física, causando a Rejeição 728 ("NF-e sem
        // informação da IE do destinatário") mesmo com o campo tecnicamente preenchido.
        var ehPessoaFisica = cpfCnpjDigitos?.Length == 11;
        var temIe = !ehPessoaFisica && !string.IsNullOrWhiteSpace(destinatario.InscricaoEstadual);
        // A tag <IE> do XML da NF-e só aceita "[0-9]{2,14}" ou o literal "ISENTO" — nunca vazia.
        // Sem IE (ou pessoa física), manda "ISENTO" + indicador 9 (não contribuinte). Com IE
        // cadastrada (só possível pra CNPJ), indicador 1 (contribuinte) e o valor real.
        var ieDestinatario = temIe ? destinatario.InscricaoEstadual : "ISENTO";
        var indicadorIeDestinatario = temIe ? 1 : 9;

        return new
        {
            natureza_operacao = pedido.NaturezaOperacao,
            data_emissao = DateTimeOffset.UtcNow.ToString("yyyy-MM-ddTHH:mm:sszzz"),
            tipo_documento = 1,      // 1 = saída (o Cliente é sempre o emitente aqui)
            finalidade_emissao = MapearFinalidadeEmissao(pedido.FinalidadeEmissao),
            presenca_comprador = 9,  // 9 = não se aplica (operação não presencial)
            modalidade_frete = MapearModalidadeFrete(pedido.ModalidadeFrete),
            cnpj_emitente = SoDigitos(cliente.Cnpj),
            // A Focus tenta completar o resto do emitente a partir do cadastro feito no
            // registro do certificado (POST /empresas), mas se dado fiscal do Cliente mudar
            // DEPOIS desse registro (ex.: IE preenchida só depois na tela Empresa), isso nunca
            // fica sincronizado de volta lá — manda tudo explícito aqui pra não depender disso.
            nome_emitente = cliente.RazaoSocial,
            nome_fantasia_emitente = cliente.NomeFantasia,
            logradouro_emitente = cliente.Logradouro,
            numero_emitente = cliente.Numero,
            bairro_emitente = cliente.Bairro,
            municipio_emitente = cliente.Cidade,
            uf_emitente = cliente.Estado,
            cep_emitente = SoDigitos(cliente.Cep),
            inscricao_estadual_emitente = string.IsNullOrWhiteSpace(cliente.InscricaoEstadual) ? null : cliente.InscricaoEstadual,
            regime_tributario_emitente = MapearRegimeTributario(cliente.RegimeTributario),

            cnpj_destinatario = cpfCnpjDigitos?.Length == 14 ? cpfCnpjDigitos : null,
            cpf_destinatario = cpfCnpjDigitos?.Length == 11 ? cpfCnpjDigitos : null,
            nome_destinatario = destinatario.RazaoSocial,
            inscricao_estadual_destinatario = ieDestinatario,
            indicador_inscricao_estadual_destinatario = indicadorIeDestinatario,
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
                codigo_ncm = item.Ncm,
                unidade_comercial = item.Unidade,
                quantidade_comercial = item.Quantidade,
                valor_unitario_comercial = item.PrecoUnitario,
                valor_bruto = item.ValorTotal,
                unidade_tributavel = item.Unidade,
                quantidade_tributavel = item.Quantidade,
                valor_unitario_tributavel = item.PrecoUnitario,
                icms_origem = 0,
                icms_situacao_tributaria = "102", // CSOSN Simples Nacional sem crédito — ajustar por regime
                pis_situacao_tributaria = "07",
                cofins_situacao_tributaria = "07",
            }).ToList(),

            informacoes_adicionais_contribuinte = MontarInformacoesComplementares(cliente, pedido),
        };
    }

    // Em homologação a SEFAZ EXIGE esse aviso nas informações complementares — sem ele a nota
    // é rejeitada. Concatena com o que o usuário escreveu no pedido, se houver algo.
    private const string AvisoHomologacao = "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL";

    private static string? MontarInformacoesComplementares(Cliente cliente, Pedido pedido)
    {
        var emHomologacao = !cliente.FocusNfeAmbiente.Equals("producao", StringComparison.OrdinalIgnoreCase);
        var texto = pedido.InformacoesComplementares;

        if (!emHomologacao)
            return string.IsNullOrWhiteSpace(texto) ? null : texto;

        return string.IsNullOrWhiteSpace(texto) ? AvisoHomologacao : $"{AvisoHomologacao} - {texto}";
    }

    private static string? SoDigitos(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? null : new string(valor.Where(char.IsDigit).ToArray());

    // Códigos da SEFAZ pro campo finalidade_emissao: 1=Normal, 2=Complementar, 3=Ajuste,
    // 4=Devolução/Retorno.
    private static int MapearFinalidadeEmissao(string finalidade) => finalidade switch
    {
        "Complementar" => 2,
        "Ajuste" => 3,
        "Devolucao" => 4,
        _ => 1,
    };

    // Códigos da SEFAZ pro campo modalidade_frete: 0=emitente, 1=destinatário, 2=terceiros,
    // 9=sem frete.
    private static int MapearModalidadeFrete(string modalidade) => modalidade switch
    {
        "EmitenteContaFrete" => 0,
        "DestinatarioContaFrete" => 1,
        "Terceiros" => 2,
        _ => 9,
    };

    // Mesmo mapeamento de FocusNfeService.MapearRegimeTributario (Infrastructure) — duplicado
    // aqui porque Application não pode depender de Infrastructure; é só 4 linhas, não vale a
    // pena criar uma dependência cruzada pra isso. 1=Simples Nacional, 2=Simples c/ excesso,
    // 3=Normal (Lucro Presumido/Real), 4=MEI.
    private static int MapearRegimeTributario(string? regime) => regime switch
    {
        "LucroReal" => 3,
        "LucroPresumido" => 3,
        "Mei" => 4,
        _ => 1,
    };
}
