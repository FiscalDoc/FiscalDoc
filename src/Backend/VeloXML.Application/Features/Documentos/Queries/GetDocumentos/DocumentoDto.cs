namespace VeloXML.Application.Features.Documentos.Queries.GetDocumentos;

public record DocumentoItemDto(
    string? CodigoProduto,
    string Descricao,
    string? Ncm,
    string? Cfop,
    string Unidade,
    decimal Quantidade,
    decimal ValorUnitario,
    decimal ValorTotal
);

public record DocumentoImpostosDto(
    decimal? ValorProdutos,
    decimal? ValorFrete,
    decimal? ValorSeguro,
    decimal? ValorDesconto,
    decimal? ValorIcms,
    decimal? ValorIpi,
    decimal? ValorPis,
    decimal? ValorCofins,
    decimal? ValorOutrasDespesas,
    decimal? ValorAproxTributos
);

public record DocumentoDto(
    Guid Id,
    Guid ClienteId,
    string NomeCliente,
    string Tipo,
    string TipoNome,
    string Status,
    string StatusNome,
    string OrigemImportacao,
    string OrigemImportacaoNome,
    string Numero,
    string? ChaveAcesso,
    string? CnpjEmitente,
    string? NomeEmitente,
    string? CnpjDestinatario,
    string? NomeDestinatario,
    DateTime DataEmissao,
    decimal ValorTotal,
    int TotalArquivos,
    int TotalAlertas,
    DateTime CreatedAt,
    DocumentoImpostosDto Impostos,
    List<DocumentoItemDto> Itens
);
