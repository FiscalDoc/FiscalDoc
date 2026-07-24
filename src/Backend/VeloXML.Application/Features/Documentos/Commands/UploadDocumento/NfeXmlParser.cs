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
        var tot  = infNFe.Element(ns + "total")?.Element(ns + "ICMSTot");

        var chave = doc.Descendants(ns + "chNFe").FirstOrDefault()?.Value
                 ?? infNFe.Attribute("Id")?.Value?.Replace("NFe", "");

        return new ParsedDocumento(
            Numero:            ide?.Element(ns + "nNF")?.Value ?? string.Empty,
            ChaveAcesso:       chave,
            CnpjEmitente:      (emit?.Element(ns + "CNPJ") ?? emit?.Element(ns + "CPF"))?.Value,
            NomeEmitente:      emit?.Element(ns + "xNome")?.Value,
            CnpjDestinatario:  (dest?.Element(ns + "CNPJ") ?? dest?.Element(ns + "CPF"))?.Value,
            NomeDestinatario:  dest?.Element(ns + "xNome")?.Value,
            DataEmissao:       ParseDate(ide?.Element(ns + "dhEmi")?.Value),
            ValorTotal:        ParseDecimal(tot?.Element(ns + "vNF")?.Value)
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
}

internal record ParsedDocumento(
    string Numero,
    string? ChaveAcesso,
    string? CnpjEmitente,
    string? NomeEmitente,
    string? CnpjDestinatario,
    string? NomeDestinatario,
    DateTime DataEmissao,
    decimal ValorTotal
);
