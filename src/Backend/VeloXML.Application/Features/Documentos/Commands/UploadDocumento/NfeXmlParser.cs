using System.Globalization;
using System.Xml.Linq;

namespace VeloXML.Application.Features.Documentos.Commands.UploadDocumento;

internal static class NfeXmlParser
{
    private static readonly XNamespace NfeNs  = "http://www.portalfiscal.inf.br/nfe";
    private static readonly XNamespace CteNs  = "http://www.portalfiscal.inf.br/cte";
    private static readonly XNamespace MdfeNs = "http://www.portalfiscal.inf.br/mdfe";

    public static ParsedDocumento? Parse(Stream xml)
    {
        try
        {
            xml.Position = 0;
            var doc = XDocument.Load(xml);
            xml.Position = 0;

            var infNFe = doc.Descendants(NfeNs + "infNFe").FirstOrDefault();
            if (infNFe != null) return ParseNFe(infNFe, doc);

            var infCte = doc.Descendants(CteNs + "infCte").FirstOrDefault();
            if (infCte != null) return ParseCTe(infCte, doc);

            var infMDFe = doc.Descendants(MdfeNs + "infMDFe").FirstOrDefault();
            if (infMDFe != null) return ParseMDFe(infMDFe);

            return null;
        }
        catch
        {
            return null;
        }
    }

    private static ParsedDocumento ParseNFe(XElement infNFe, XDocument doc)
    {
        var ns   = NfeNs;
        var ide  = infNFe.Element(ns + "ide");
        var emit = infNFe.Element(ns + "emit");
        var dest = infNFe.Element(ns + "dest");
        var enderDest = dest?.Element(ns + "enderDest");
        var tot  = infNFe.Element(ns + "total")?.Element(ns + "ICMSTot");

        var chave = doc.Descendants(ns + "chNFe").FirstOrDefault()?.Value
                 ?? infNFe.Attribute("Id")?.Value?.Replace("NFe", "");

        var itens = infNFe.Elements(ns + "det").Select(det =>
        {
            var prod = det.Element(ns + "prod");
            return new ParsedDocumentoItem(
                CodigoProduto:  prod?.Element(ns + "cProd")?.Value,
                Descricao:      prod?.Element(ns + "xProd")?.Value ?? string.Empty,
                Ncm:            prod?.Element(ns + "NCM")?.Value,
                Cfop:           prod?.Element(ns + "CFOP")?.Value,
                Unidade:        prod?.Element(ns + "uCom")?.Value ?? "UN",
                Quantidade:     ParseDecimal(prod?.Element(ns + "qCom")?.Value),
                ValorUnitario:  ParseDecimal(prod?.Element(ns + "vUnCom")?.Value),
                ValorTotal:     ParseDecimal(prod?.Element(ns + "vProd")?.Value),
                // Alíquotas variam de sub-nó conforme o CST/CSOSN (ICMS00, ICMS40, ICMS60…) —
                // busca por nome local em qualquer nível abaixo de <imposto>, sem acoplar a um
                // CST específico, já que pra exibição/cadastro só a alíquota importa, não o
                // enquadramento fiscal completo.
                AliquotaIcms:   ParseDecimal(det.Descendants(ns + "pICMS").FirstOrDefault()?.Value),
                AliquotaPis:    ParseDecimal(det.Descendants(ns + "pPIS").FirstOrDefault()?.Value),
                AliquotaCofins: ParseDecimal(det.Descendants(ns + "pCOFINS").FirstOrDefault()?.Value)
            );
        }).ToList();

        return new ParsedDocumento(
            Numero:            ide?.Element(ns + "nNF")?.Value ?? string.Empty,
            ChaveAcesso:       chave,
            CnpjEmitente:      (emit?.Element(ns + "CNPJ") ?? emit?.Element(ns + "CPF"))?.Value,
            NomeEmitente:      emit?.Element(ns + "xNome")?.Value,
            CnpjDestinatario:  (dest?.Element(ns + "CNPJ") ?? dest?.Element(ns + "CPF"))?.Value,
            NomeDestinatario:  dest?.Element(ns + "xNome")?.Value,
            DataEmissao:       ParseDate(ide?.Element(ns + "dhEmi")?.Value),
            ValorTotal:        ParseDecimal(tot?.Element(ns + "vNF")?.Value),

            DestinatarioIe:          dest?.Element(ns + "IE")?.Value,
            DestinatarioLogradouro:  enderDest?.Element(ns + "xLgr")?.Value,
            DestinatarioNumero:      enderDest?.Element(ns + "nro")?.Value,
            DestinatarioComplemento: enderDest?.Element(ns + "xCpl")?.Value,
            DestinatarioBairro:      enderDest?.Element(ns + "xBairro")?.Value,
            DestinatarioCidade:      enderDest?.Element(ns + "xMun")?.Value,
            DestinatarioUf:          enderDest?.Element(ns + "UF")?.Value,
            DestinatarioCep:         enderDest?.Element(ns + "CEP")?.Value,
            DestinatarioCodIbge:     enderDest?.Element(ns + "cMun")?.Value,

            // Totais já vêm agregados pelo emissor em <total><ICMSTot>, independente de quantos
            // CSTs/regras diferentes os itens tenham — não precisamos recalcular nada aqui.
            ValorProdutos:       ParseDecimalNullable(tot?.Element(ns + "vProd")?.Value),
            ValorFrete:          ParseDecimalNullable(tot?.Element(ns + "vFrete")?.Value),
            ValorSeguro:         ParseDecimalNullable(tot?.Element(ns + "vSeg")?.Value),
            ValorDesconto:       ParseDecimalNullable(tot?.Element(ns + "vDesc")?.Value),
            ValorIcms:           ParseDecimalNullable(tot?.Element(ns + "vICMS")?.Value),
            ValorIpi:            ParseDecimalNullable(tot?.Element(ns + "vIPI")?.Value),
            ValorPis:            ParseDecimalNullable(tot?.Element(ns + "vPIS")?.Value),
            ValorCofins:         ParseDecimalNullable(tot?.Element(ns + "vCOFINS")?.Value),
            ValorOutrasDespesas: ParseDecimalNullable(tot?.Element(ns + "vOutro")?.Value),
            ValorAproxTributos:  ParseDecimalNullable(tot?.Element(ns + "vTotTrib")?.Value),

            Itens: itens
        );
    }

    private static ParsedDocumento ParseCTe(XElement infCte, XDocument doc)
    {
        var ns   = CteNs;
        var ide  = infCte.Element(ns + "ide");
        var emit = infCte.Element(ns + "emit");
        var vPrest = infCte.Element(ns + "vPrest");

        var chave = doc.Descendants(ns + "chCTe").FirstOrDefault()?.Value
                 ?? infCte.Attribute("Id")?.Value?.Replace("CTe", "");

        return new ParsedDocumento(
            Numero:            ide?.Element(ns + "nCT")?.Value ?? string.Empty,
            ChaveAcesso:       chave,
            CnpjEmitente:      emit?.Element(ns + "CNPJ")?.Value,
            NomeEmitente:      emit?.Element(ns + "xNome")?.Value,
            CnpjDestinatario:  null,
            NomeDestinatario:  null,
            DataEmissao:       ParseDate(ide?.Element(ns + "dhEmi")?.Value),
            ValorTotal:        ParseDecimal(vPrest?.Element(ns + "vTPrest")?.Value)
        );
    }

    private static ParsedDocumento ParseMDFe(XElement infMDFe)
    {
        var ns   = MdfeNs;
        var ide  = infMDFe.Element(ns + "ide");
        var emit = infMDFe.Element(ns + "emit");

        return new ParsedDocumento(
            Numero:            ide?.Element(ns + "nMDF")?.Value ?? string.Empty,
            ChaveAcesso:       infMDFe.Attribute("Id")?.Value,
            CnpjEmitente:      emit?.Element(ns + "CNPJ")?.Value,
            NomeEmitente:      emit?.Element(ns + "xNome")?.Value,
            CnpjDestinatario:  null,
            NomeDestinatario:  null,
            DataEmissao:       ParseDate(ide?.Element(ns + "dhEmi")?.Value),
            ValorTotal:        0
        );
    }

    private static DateTime ParseDate(string? value) =>
        DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt)
            ? dt.ToUniversalTime()
            : DateTime.UtcNow;

    private static decimal ParseDecimal(string? value) =>
        decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : 0;

    private static decimal? ParseDecimalNullable(string? value) =>
        decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var v) ? v : null;
}

internal record ParsedDocumentoItem(
    string? CodigoProduto,
    string Descricao,
    string? Ncm,
    string? Cfop,
    string Unidade,
    decimal Quantidade,
    decimal ValorUnitario,
    decimal ValorTotal,
    decimal AliquotaIcms = 0,
    decimal AliquotaPis = 0,
    decimal AliquotaCofins = 0
);

internal record ParsedDocumento(
    string Numero,
    string? ChaveAcesso,
    string? CnpjEmitente,
    string? NomeEmitente,
    string? CnpjDestinatario,
    string? NomeDestinatario,
    DateTime DataEmissao,
    decimal ValorTotal,

    string? DestinatarioIe = null,
    string? DestinatarioLogradouro = null,
    string? DestinatarioNumero = null,
    string? DestinatarioComplemento = null,
    string? DestinatarioBairro = null,
    string? DestinatarioCidade = null,
    string? DestinatarioUf = null,
    string? DestinatarioCep = null,
    string? DestinatarioCodIbge = null,

    decimal? ValorProdutos = null,
    decimal? ValorFrete = null,
    decimal? ValorSeguro = null,
    decimal? ValorDesconto = null,
    decimal? ValorIcms = null,
    decimal? ValorIpi = null,
    decimal? ValorPis = null,
    decimal? ValorCofins = null,
    decimal? ValorOutrasDespesas = null,
    decimal? ValorAproxTributos = null,

    List<ParsedDocumentoItem>? Itens = null
);
